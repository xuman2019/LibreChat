import {
  Tools,
  Constants,
  ContentTypes,
  ToolCallTypes,
  imageGenTools,
  isImageVisionTool,
} from 'librechat-data-provider';
import { memo } from 'react';
import type {
  TMessageContentParts,
  TAttachment,
  FunctionToolCall,
  CodeToolCall,
  Agents,
} from 'librechat-data-provider';
import { ImageGen, EmptyText, Reasoning, ExecuteCode, AgentUpdate, Text } from './Parts';
import { ErrorMessage } from './MessageContent';
import RetrievalCall from './RetrievalCall';
import AgentHandoff from './AgentHandoff';
import CodeAnalyze from './CodeAnalyze';
import Container from './Container';
import WebSearch from './WebSearch';
import ToolCall from './ToolCall';
import Image from './Image';

type PartProps = {
  part?: TMessageContentParts;
  isLast?: boolean;
  isSubmitting: boolean;
  showCursor: boolean;
  isCreatedByUser: boolean;
  attachments?: TAttachment[];
};

const Part = memo(
  ({ part, isSubmitting, attachments, isLast, showCursor, isCreatedByUser }: PartProps) => {
    if (!part) {
      return null;
    }

    if (part.type === ContentTypes.ERROR) {
      return (
        <ErrorMessage
          text={
            part[ContentTypes.ERROR] ??
            (typeof part[ContentTypes.TEXT] === 'string'
              ? part[ContentTypes.TEXT]
              : part.text?.value) ??
            ''
          }
          className="my-2"
        />
      );
    }

    if (part.type === ContentTypes.AGENT_UPDATE) {
      return (
        <>
          <AgentUpdate currentAgentId={part[ContentTypes.AGENT_UPDATE]?.agentId} />
          {isLast && showCursor && (
            <Container>
              <EmptyText />
            </Container>
          )}
        </>
      );
    }

    if (part.type === ContentTypes.TEXT) {
      const text = typeof part.text === 'string' ? part.text : part.text?.value;
      if (typeof text !== 'string') {
        return null;
      }
      if (part.tool_call_ids != null && !text) {
        return null;
      }
      if (text.length > 0 && /^\s*$/.test(text)) {
        if (isLast && showCursor) {
          return (
            <Container>
              <EmptyText />
            </Container>
          );
        }
        if (!isLast) {
          return null;
        }
      }
      return (
        <Container>
          <Text text={text} isCreatedByUser={isCreatedByUser} showCursor={showCursor} />
        </Container>
      );
    }

    if (part.type === ContentTypes.THINK) {
      const reasoning = typeof part.think === 'string' ? part.think : part.think?.value;
      if (typeof reasoning !== 'string') {
        return null;
      }
      return <Reasoning reasoning={reasoning} isLast={isLast ?? false} />;
    }

    if (part.type === ContentTypes.TOOL_CALL) {
      const toolCall = part[ContentTypes.TOOL_CALL];
      if (!toolCall) {
        return null;
      }

      const progress = toolCall.progress ?? 0.1;
      const isToolCall =
        'args' in toolCall && (!toolCall.type || toolCall.type === ToolCallTypes.TOOL_CALL);

      if (isToolCall) {
        const tc = toolCall as Agents.ToolCall & { progress?: number };
        const name = tc.name ?? '';

        if (name === Tools.execute_code || name === Constants.PROGRAMMATIC_TOOL_CALLING) {
          return (
            <ExecuteCode
              attachments={attachments}
              isSubmitting={isSubmitting}
              output={tc.output ?? ''}
              initialProgress={progress}
              args={tc.args}
            />
          );
        }
        if (name === 'image_gen_oai' || name === 'image_edit_oai' || name === 'gemini_image_gen') {
          return (
            <ImageGen
              initialProgress={progress}
              isSubmitting={isSubmitting}
              toolName={name}
              args={typeof tc.args === 'string' ? tc.args : ''}
              output={tc.output ?? ''}
              attachments={attachments}
            />
          );
        }
        if (name === Tools.web_search) {
          return (
            <WebSearch
              output={tc.output ?? ''}
              initialProgress={progress}
              isSubmitting={isSubmitting}
              attachments={attachments}
              isLast={isLast}
            />
          );
        }
        if (name.startsWith(Constants.LC_TRANSFER_TO_)) {
          return <AgentHandoff args={tc.args ?? ''} name={name} output={tc.output ?? ''} />;
        }
        return (
          <ToolCall
            args={tc.args ?? ''}
            name={name}
            output={tc.output ?? ''}
            initialProgress={progress}
            isSubmitting={isSubmitting}
            attachments={attachments}
            auth={tc.auth}
            expires_at={tc.expires_at}
            isLast={isLast}
          />
        );
      }

      if (toolCall.type === ToolCallTypes.CODE_INTERPRETER) {
        const ci = toolCall as CodeToolCall & { progress?: number };
        return (
          <CodeAnalyze
            initialProgress={progress}
            code={ci.code_interpreter.input}
            outputs={ci.code_interpreter.outputs ?? []}
          />
        );
      }

      if (
        toolCall.type === ToolCallTypes.RETRIEVAL ||
        toolCall.type === ToolCallTypes.FILE_SEARCH
      ) {
        return (
          <RetrievalCall
            initialProgress={progress}
            isSubmitting={isSubmitting}
            output={(toolCall as { output?: string }).output}
          />
        );
      }

      if (toolCall.type === ToolCallTypes.FUNCTION && ToolCallTypes.FUNCTION in toolCall) {
        const fn = (toolCall as FunctionToolCall).function;
        if (imageGenTools.has(fn.name)) {
          return (
            <ImageGen
              initialProgress={progress}
              args={fn.arguments as string}
              isSubmitting={isSubmitting}
              toolName={fn.name}
              output={fn.output ?? ''}
            />
          );
        }
        if (isImageVisionTool(toolCall)) {
          if (isSubmitting && showCursor) {
            return (
              <Container>
                <Text text="" isCreatedByUser={isCreatedByUser} showCursor={showCursor} />
              </Container>
            );
          }
          return null;
        }
        return (
          <ToolCall
            initialProgress={progress}
            isSubmitting={isSubmitting}
            args={fn.arguments as string}
            name={fn.name}
            output={fn.output}
            isLast={isLast}
          />
        );
      }
    }

    if (part.type === ContentTypes.IMAGE_FILE) {
      const imageFile = part[ContentTypes.IMAGE_FILE];
      const height = imageFile.height ?? 1920;
      const width = imageFile.width ?? 1080;
      return (
        <Image
          imagePath={imageFile.filepath}
          height={height}
          width={width}
          altText={imageFile.filename ?? 'Uploaded Image'}
          placeholderDimensions={{
            height: height + 'px',
            width: width + 'px',
          }}
        />
      );
    }

    return null;
  },
);

export default Part;
