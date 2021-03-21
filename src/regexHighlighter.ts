// ============================================================
// Copyright (c) 2021 Tatsuya Nakamori. All rights reserved.
// See LICENSE in the project root for license information.
// ============================================================
import * as vscode from 'vscode';


let decorationTypes:vscode.TextEditorDecorationType[] = [];
let curSelectionLineText:(string|undefined);

const colors = [
    "rgba(186, 0, 0, 1)",
    "rgba(0, 80, 0, 1)",
    "rgba(0, 0, 186, 1)",
    "rgba(60, 60, 60, 1)",
    "rgba(0, 80, 186, 1)",
    "rgba(60, 0, 60, 1)",
    "rgba(60, 60, 0, 1)"
];

const ERROR_COLORS = {
    bracketBegin: "rgba(225, 0, 0, 0.9)",
    bracketEnd: "rgba(225, 0, 0, 0.9)",
    noNesting: "rgba(100, 50, 50, 0.6)"
};


interface RangeInfo {
    range: [number, number],
    nestDepth: number
}

interface BracketInfo {
    type: ("begin"|"end"),
    nestDepth: number,
    index: number
}


export function updateDecorations(editor:vscode.TextEditor) {
    const selLine = editor.selection.anchor.line;
    const lineText = editor.document.lineAt(selLine).text;

    if (!curSelectionLineText || curSelectionLineText != lineText) {
        curSelectionLineText = lineText;
    } else {
        return
    }

    for (const decorationType of decorationTypes) {
        decorationType.dispose();
    }
    decorationTypes = [];

    // First, Extracting regular expression strings
    // Result:
    //     offset: Number of characters before the start of the regular expression string
    //     regString: Regular expression string
    const regRegString = /(?<prev>.*?\/)(?<regString>.*)\//;
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
            if (bracketCount < 0) {
                console.log("return", bracketCount);
                // break
            }
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

    console.log(bracketInfoList);

    let loopStart:number = 0;
    let nextLoopStart:number = 0;

    let rangeInfoList:RangeInfo[] = [];
    while (loopStart < bracketInfoList.length) {
        let referenceNestDepth:number = 0;
        let rangeStart:number = 0;
        let rangeEnd:number = 0;
        // console.log("============================================================================");
        // console.log("loopStart", "bracketInfoList.length=", loopStart, bracketInfoList.length);

        for (let i = loopStart; i < bracketInfoList.length; i++) {
            const type      = bracketInfoList[i].type;
            const index     = bracketInfoList[i].index;
            const nestDepth = bracketInfoList[i].nestDepth;

            // console.log("=========");
            // console.log("i", "[type, nestDepth, index]", "::", i, type, index, nestDepth);

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
                // console.log("\t=== if (nestDepth == referenceNestDepth - 1) [break]===");
                // console.log("\trangeEnd, nextLoopStart=", rangeEnd, nextLoopStart);
                break
            }

            if (i == loopStart) {
                rangeStart = index + 1;
                referenceNestDepth = nestDepth;
                // console.log("\t=== if (i == loopStart) ===");
                // console.log("\trangeStart, referenceNestDepth=", rangeStart, referenceNestDepth);

            } else if (type == "begin" && loopStart == nextLoopStart) {
                nextLoopStart = i;
                // console.log("\t=== else if (type == \"begin\" && loopStart == nextLoopStart) ===");
                // console.log("\tnextLoopStart=", nextLoopStart);
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

                // console.log("\t=== if (type == \"begin\" && nestDepth == referenceNestDepth + 1) ===");
                // console.log("\trangeEnd=", rangeEnd);
            } else if (type == "end" && nestDepth == referenceNestDepth) {
                rangeStart = index + 1;
                // console.log("\t=== else if (type == \"end\" && nestDepth == referenceNestDepth) ===");
                // console.log("\trangeStart=", rangeStart);
            }

            // console.log("\t=== for end ===");
            // console.log("\trangeStart, rangeEnd=", rangeStart, rangeEnd);
            // console.log(rangeInfoList);
        }

        // console.log("\t=== while end ===");
        // console.log("\tloopStart, nextLoopStart, rangeStart, rangeEnd=", loopStart, nextLoopStart, rangeStart, rangeEnd);
        if (loopStart == nextLoopStart) {
            break
        }
        loopStart = nextLoopStart;
    }

    console.log(rangeInfoList);
    console.log("=================================================");
    // console.log(rangeInfoList.length);
    // console.log("=================================================");

    const lastBracketInfo = bracketInfoList[bracketInfoList.length - 1];
    if (lastBracketInfo.nestDepth == 0) {
        _setDecorations(editor, rangeInfoList, selLine, offset);
    } else if (lastBracketInfo.nestDepth > 0) {
        _setErrorDecorations(editor, bracketInfoList, selLine, offset);
    } else {
        _setErrorDecorations(editor, bracketInfoList, selLine, offset);
    }
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

        const color = colors[nestDepth];
        const bgColorDecoType = vscode.window.createTextEditorDecorationType({
            backgroundColor: `${color}`,
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
        console.log(color);
        console.log(rangeInfoList);
        decorationTypes.push(decoType);
    }
}

function _setErrorDecorations(editor:vscode.TextEditor, bracketInfoList:BracketInfo[], selLine:number, offset:number) {
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
            var prevIndex = bracketInfoList[i-1].index;
        } else {
            var prevType = type;
            var prevNestDepth = 0;
            var prevIndex = 0;
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
        console.log(type, nestDepth, prevNestDepth, nextNestDepth);
        // console.log((type == "begin" && nestDepth == nextNestDepth));
        // console.log((type == "end"   && nestDepth == prevNestDepth));
        console.log((type == "begin" && nextType == "end" && nestDepth == nextNestDepth) ||
                    (type == "end" && prevType == "begin" && nestDepth == prevNestDepth));


        // Bracket Error
        var color;
        var needBorder:boolean = false;
        let startPosition = new vscode.Position(selLine, index + offset);
        let endPosition   = new vscode.Position(selLine, index + offset + 1);

        if ((type == "begin" && nextType == "end" && nestDepth == nextNestDepth) ||
            (type == "end" && prevType == "begin" && nestDepth == prevNestDepth)) {
            color = ERROR_COLORS.noNesting;
            needBorder = true;

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
        // if (needBorder) {
        //     decoration["borderWidth"] = '1px';
        //     decoration["borderStyle"] = 'solid';
        // }
        const decoType = vscode.window.createTextEditorDecorationType(decoration);
        console.log(color);
        console.log(index + offset, index + offset + 1);
        console.log("");

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
        console.log(rangeInfoList);
        decorationTypes.push(decoType);
    }
}
