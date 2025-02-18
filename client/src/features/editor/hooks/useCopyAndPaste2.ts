import { BlockLinkedList } from "@noctaCrdt/LinkedList";
import { Block } from "@noctaCrdt/Node";

interface CopyAndPasteProps {
  editorState: {
    linkedList: BlockLinkedList;
  };
  selectedBlocks: Set<string>;
}

export const useCopyAndPaste = ({ editorState, selectedBlocks }: CopyAndPasteProps) => {
  const blockToMarkdown = (blocks: Block[]): string => {
    return blocks
      .map((block) => {
        const content = block.crdt.read();
        const indent = " ".repeat(block.indent);

        switch (block.type) {
          case "h1":
            return `${indent}# ${content}`;
          case "h2":
            return `${indent}## ${content}`;
          case "h3":
            return `${indent}### ${content}`;
          case "ul":
            return `${indent}- ${content}`;
          case "ol":
            return `${indent}1. ${content}`;
          case "blockquote":
            return `${indent}> ${content}`;
          case "checkbox":
            return `${indent}[] ${content}`;
          case "hr":
            return `${indent}---`;
          default:
            return `${indent}${content}`;
        }
      })
      .join("\n");
  };

  const handleCopy = (e: React.ClipboardEvent) => {
    e.preventDefault();

    if (selectedBlocks.size > 0) {
      const selectedBlocksList = Array.from(selectedBlocks)
        .map((blockId) => {
          const [client, clock] = blockId.split("-").map(Number);
          return editorState.linkedList
            .spread()
            .find((b) => b.id.client === client && b.id.clock === clock);
        })
        .filter((block): block is Block => block !== undefined);

      const markdownContent = blockToMarkdown(selectedBlocksList);
      e.clipboardData.setData("text/plain", markdownContent);
      return;
    }

    const selection = window.getSelection();
    if (!selection) return;

    const range = selection.getRangeAt(0);
    if (!range) return;

    const text = range.toString();
    e.clipboardData.setData("text/plain", text);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    console.log("PASTE", text);
    // NOTE ("# 제목\n 내용") 붙혀넣기 로직
  };

  return {
    handleCopy,
    handlePaste,
  };
};
