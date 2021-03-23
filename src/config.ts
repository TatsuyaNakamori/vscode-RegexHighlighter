// ============================================================
// Copyright (c) 2021 Tatsuya Nakamori. All rights reserved.
// See LICENSE in the project root for license information.
// ============================================================
import * as vscode from 'vscode';


export function getColors():string[] {
    const confName = "regexhighlighter.highlight.color";
    const config = vscode.workspace.getConfiguration(confName);

    const colors = [
        config["BracketNestDepthLevel 1"],
        config["BracketNestDepthLevel 2"],
        config["BracketNestDepthLevel 3"],
        config["BracketNestDepthLevel 4"],
        config["BracketNestDepthLevel 5"],
        config["BracketNestDepthLevel 6"],
        config["BracketNestDepthLevel 7"],
        config["BracketNestDepthLevel 8"],
        config["BracketNestDepthLevel 9"],
        config["BracketNestDepthLevel 10"]
    ]
    return colors
}

interface ErrorColors {
    bracketBegin:string,
    bracketEnd:string,
    noNesting:string
};
export function getErrorColors():ErrorColors {
    const confName = "regexhighlighter.highlight.errorColor";
    const config = vscode.workspace.getConfiguration(confName);

    const errorColors = {
        bracketBegin: config["bracketBegin"],
        bracketEnd  : config["bracketEnd"],
        noNesting   : config["noNesting"]
    };
    return errorColors
}

export function getStopHighlighting():boolean {
    const confGroupName = "regexhighlighter";
    const confName = "stoppingRegexHighlighting";
    const config = vscode.workspace.getConfiguration(confGroupName);
    const pause:(boolean|undefined) = config.get(confName);

    if (pause) {
        return true
    } else {
        return false
    }
}

export async function setPauseConfig(pause:boolean) {
    const confName = "regexhighlighter";
    const config = vscode.workspace.getConfiguration(confName);
    await config.update("stoppingRegexHighlighting", pause);
}

export function setContext() {
    const confGroupName = "regexhighlighter";
    const confName = "stoppingRegexHighlighting";
    const config = vscode.workspace.getConfiguration(confGroupName);
    const pause:(boolean|undefined) = config.get(confName);

    if (pause) {
        vscode.commands.executeCommand(
            'setContext', 'regexhighlighter.stop.highlighting', true
        );
    } else {
        vscode.commands.executeCommand(
            'setContext', 'regexhighlighter.stop.highlighting', false
        );
    }
}
