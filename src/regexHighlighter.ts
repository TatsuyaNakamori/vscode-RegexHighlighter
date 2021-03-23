// ============================================================
// Copyright (c) 2021 Tatsuya Nakamori. All rights reserved.
// See LICENSE in the project root for license information.
// ============================================================
import * as vscode from 'vscode';
import * as config from './config';


// ===================================
// Global Vars, interface, functions
// ===================================
let decorationTypes:vscode.TextEditorDecorationType[] = [];
let curSelectionLineText:(string|undefined);

interface RangeInfo {
    range: [number, number],
    nestDepth: number
}

interface BracketInfo {
    type: ("begin"|"end"),
    nestDepth: number,
    index: number
}

export function updateDecorations(editor:vscode.TextEditor, changedConfig?:boolean) {
    if (config.getStopHighlighting()) {
        disposeDecorationType();
        return
    }

    // Get the current line of text and check if it needs to be updated.
    const selLine = editor.selection.anchor.line;
    const lineText = editor.document.lineAt(selLine).text;
    if (changedConfig || (!curSelectionLineText || curSelectionLineText != lineText)) {
        curSelectionLineText = lineText;
    } else {
        return
    }

    disposeDecorationType();

    // First, Extracting regular expression strings
    // Result:
    //     offset: Number of characters before the start of the regular expression string
    //     regString: Regular expression string
    const regRegString = /(?<prev>.*?r?(\/|\"|\"\"\"|\'|\'\'\'))(?<regString>.*)(\/|\"|\"\"\"|\'|\'\'\')/;
    let match = regRegString.exec(lineText);
    if (!match) { return }
    const matchGroups = match.groups;
    if (!matchGroups) { return }

    const offset = matchGroups.prev.length;
    const regString = matchGroups.regString;

    // Parse Regex
    let bracketInfoList:BracketInfo[] = [];

    let escapeFlag:boolean = false;
    let bracketCount:number = 0;
    for (let i = 0; i < regString.length; i++) {
        const str = regString[i];
        const escapeMatch  = str.match(/\\/);
        const bracketBegin = str.match(/\(/);
        const bracketEnd   = str.match(/\)/);

        // [Escape] Process
        if (escapeFlag) {
            escapeFlag = false;
            continue
        } else if (escapeMatch) {
            escapeFlag = true;
            continue
        }

        // Bracket Count
        if (bracketBegin && !escapeFlag) {
            bracketCount += 1;
        }
        if (bracketEnd && !escapeFlag) {
            bracketCount -= 1;
        }

        // BracketInfo
        let bracketInfoType:("begin"|"end");
        if (bracketBegin) {
            bracketInfoType = "begin";
        } else if (bracketEnd) {
            bracketInfoType = "end";
        } else {
            continue
        }
        const bracketInfo:BracketInfo = {
            type: bracketInfoType,
            nestDepth: bracketCount,
            index: i
        }
        bracketInfoList.push(bracketInfo);
    }

    // console.log(bracketInfoList);

    let loopStart:number = 0;
    let nextLoopStart:number = 0;

    let rangeInfoList:RangeInfo[] = [];
    while (loopStart < bracketInfoList.length) {
        let referenceNestDepth:number = 0;
        let rangeStart:number = 0;
        let rangeEnd:number = 0;

        for (let i = loopStart; i < bracketInfoList.length; i++) {
            const type      = bracketInfoList[i].type;
            const index     = bracketInfoList[i].index;
            const nestDepth = bracketInfoList[i].nestDepth;

            if (nestDepth == referenceNestDepth - 1) {
                rangeEnd = index - 1;
                if (rangeStart <= rangeEnd && !_hasSameRange(rangeInfoList, rangeStart, rangeEnd)) {
                    rangeInfoList.push(
                        {
                            range: [rangeStart, rangeEnd],
                            nestDepth: referenceNestDepth
                        }
                    );
                }

                if (loopStart == nextLoopStart) {
                    nextLoopStart = i;
                }
                break
            }

            if (i == loopStart) {
                rangeStart = index + 1;
                referenceNestDepth = nestDepth;
            } else if (type == "begin" && loopStart == nextLoopStart) {
                nextLoopStart = i;
            }

            if (type == "begin" && nestDepth == referenceNestDepth + 1) {
                rangeEnd = index - 1;
                if (rangeStart <= rangeEnd && !_hasSameRange(rangeInfoList, rangeStart, rangeEnd)) {
                    rangeInfoList.push(
                        {
                            range: [rangeStart, rangeEnd],
                            nestDepth: referenceNestDepth
                        }
                    );
                }
            } else if (type == "end" && nestDepth == referenceNestDepth) {
                rangeStart = index + 1;
            }
        }

        if (loopStart == nextLoopStart) {
            break
        }
        loopStart = nextLoopStart;
    }

    // console.log(rangeInfoList);

    const lastBracketInfo = bracketInfoList[bracketInfoList.length - 1];
    if (lastBracketInfo.nestDepth == 0) {
        _setDecorations(editor, rangeInfoList, selLine, offset);
    } else if (lastBracketInfo.nestDepth > 0) {
        _setErrorDecorations(editor, bracketInfoList, selLine, offset);
    } else {
        _setErrorDecorations(editor, bracketInfoList, selLine, offset);
    }
}

export function disposeDecorationType() {
    for (const decorationType of decorationTypes) {
        decorationType.dispose();
    }
    decorationTypes = [];
}

function _hasSameRange(rangeInfoList:RangeInfo[], rangeStart:number, rangeEnd:number):boolean {
    for (const rangeInfo of rangeInfoList) {
        const start = rangeInfo.range[0];
        const end = rangeInfo.range[1];

        if (start == rangeStart && end == rangeEnd) {
            return true
        }
    }
    return false
}

function _setDecorations(editor:vscode.TextEditor, rangeInfoList:RangeInfo[], selLine:number, offset:number) {
    const COLORS:string[] = config.getColors();
    const BORDER_COLOR = "#505070"

    interface DecoInfo {
        [nestDepth:number]: {
            range: vscode.Range[],
            decoType: vscode.TextEditorDecorationType,
            color?: string
        }
    }
    let decoInfo:DecoInfo = {};
    for (let i = 0; i < rangeInfoList.length; i++) {
        const rangeStart = rangeInfoList[i].range[0];
        const rangeEnd   = rangeInfoList[i].range[1];
        const nestDepth  = rangeInfoList[i].nestDepth;

        const color = COLORS[nestDepth-1];
        const bgColorDecoType = vscode.window.createTextEditorDecorationType({
            backgroundColor: `${color}`,
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: `${BORDER_COLOR}`
        });

        const startPosition = new vscode.Position(selLine, rangeStart+offset);
        const endPosition = new vscode.Position(selLine, rangeEnd+offset+1);

        if (!decoInfo[nestDepth]) {
            decoInfo[nestDepth] = {
                range: [new vscode.Range(startPosition, endPosition)],
                decoType: bgColorDecoType,
                color: color
            };
        } else {
            decoInfo[nestDepth]["range"].push(
                new vscode.Range(startPosition, endPosition)
            );
            decoInfo[nestDepth]["decoType"] = bgColorDecoType;
            decoInfo[nestDepth]["color"] = color;

        }
    }

    for (const neseDepth in decoInfo) {
        const rangeInfoList = decoInfo[neseDepth]["range"];
        const decoType = decoInfo[neseDepth]["decoType"];
        const color = decoInfo[neseDepth]["color"];
        editor.setDecorations(decoType, rangeInfoList);
        // console.log(rangeInfoList);
        decorationTypes.push(decoType);
    }
}

function _setErrorDecorations(editor:vscode.TextEditor, bracketInfoList:BracketInfo[], selLine:number, offset:number) {
    interface ErrorColors {
        bracketBegin:string,
        bracketEnd:string,
        noNesting:string
    };
    const ERROR_COLORS:ErrorColors = config.getErrorColors();

    interface ErrorDecoInfo {
        [errorType:string]: {
            range: vscode.Range[],
            decoType: vscode.TextEditorDecorationType,
        }
    }
    let errorDecoInfo:ErrorDecoInfo = {};
    for (let i = 0; i < bracketInfoList.length; i++) {
        const index = bracketInfoList[i].index;

        const type = bracketInfoList[i].type;
        const nestDepth = bracketInfoList[i].nestDepth;
        if (i != 0) {
            var prevType = bracketInfoList[i-1].type;
            var prevNestDepth = bracketInfoList[i-1].nestDepth - 1;
        } else {
            var prevType = type;
            var prevNestDepth = 0;
        }
        if (i != bracketInfoList.length - 1) {
            var nextType = bracketInfoList[i+1].type;
            var nextNestDepth = bracketInfoList[i+1].nestDepth + 1;
            var nextIndex = bracketInfoList[i+1].index;
        } else {
            var nextType = type;
            var nextNestDepth = 0;
            var nextIndex = 0;
        }

        // Bracket Error
        var color;
        let startPosition = new vscode.Position(selLine, index + offset);
        let endPosition   = new vscode.Position(selLine, index + offset + 1);

        if ((type == "begin" && nextType == "end" && nestDepth == nextNestDepth) ||
            (type == "end" && prevType == "begin" && nestDepth == prevNestDepth)) {
            color = ERROR_COLORS.noNesting;

            if (type == "begin") {
                startPosition = new vscode.Position(selLine, index + offset + 1);
                endPosition   = new vscode.Position(selLine, nextIndex + offset);
            } else {
                continue
            }
        } else if (type == "begin") {
            color = ERROR_COLORS.bracketBegin;
        } else if (type == "end") {
            color = ERROR_COLORS.bracketEnd;
        }

        interface Decoration {
            backgroundColor: string,
            borderWidth?: string,
            borderStyle?: string
        }
        let decoration:Decoration = {
            backgroundColor: `${color}`
        }
        const decoType = vscode.window.createTextEditorDecorationType(decoration);

        var errorType:string = "";
        if (color == ERROR_COLORS.noNesting) {
            errorType = "noNesting";
        } else if (color == ERROR_COLORS.bracketBegin) {
            errorType = "bracketBegin";
        } else if (color == ERROR_COLORS.bracketEnd) {
            errorType = "bracketEnd";
        }

        if (!errorDecoInfo[errorType]) {
            errorDecoInfo[errorType] = {
                range: [new vscode.Range(startPosition, endPosition)],
                decoType: decoType
            }
        } else {
            errorDecoInfo[errorType]["range"].push(
                new vscode.Range(startPosition, endPosition)
            );
            errorDecoInfo[errorType]["decoType"] = decoType;
        }

        if (nestDepth < 0) {
            break
        }
    }

    for (const errorType in errorDecoInfo) {
        const rangeInfoList = errorDecoInfo[errorType].range;
        const decoType = errorDecoInfo[errorType].decoType;
        editor.setDecorations(decoType, rangeInfoList);
        // console.log(rangeInfoList);
        decorationTypes.push(decoType);
    }
}
