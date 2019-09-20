import { TextEditor, TextLine } from 'vscode';

export function getVisibleLines(editor: TextEditor): null | TextLine[] {
    const document = editor.document;
    const { visibleRanges, selection } = editor;

    const visibleLineNumbers = [];
    for (const range of visibleRanges) {
        let lineNumber = range.start.line;
        while (lineNumber <= range.end.line) {
            visibleLineNumbers.push(lineNumber);
            lineNumber += 1;
        }
    }

    const activeLineIndex = visibleLineNumbers.indexOf(selection.start.line);
    if (activeLineIndex === -1) {
        return null;
    }

    let leftIndex = activeLineIndex - 1;
    let rightIndex = activeLineIndex + 1;

    const visibleLines: TextLine[] = [document.lineAt(visibleLineNumbers[activeLineIndex])];
    const maxRightIndex = visibleLineNumbers.length;

    while (leftIndex > -1 || rightIndex < maxRightIndex) {
        if (leftIndex > -1) {
            visibleLines.push(document.lineAt(visibleLineNumbers[leftIndex--]));
        }
        if (rightIndex < maxRightIndex) {
            visibleLines.push(document.lineAt(visibleLineNumbers[rightIndex++]));
        }
    }

    return visibleLines.filter((textLine): boolean => textLine.isEmptyOrWhitespace === false);
}
