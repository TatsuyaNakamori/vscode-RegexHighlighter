// ============================================================
// Copyright (c) 2021 Tatsuya Nakamori. All rights reserved.
// See LICENSE in the project root for license information.
// ============================================================
import * as vscode from 'vscode';
import * as regexHighlighter from './regexHighlighter';


export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "regexhighlighter" is now active!');

    vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
            regexHighlighter.updateDecorations(editor);
        }
    }, null, context.subscriptions);

    vscode.workspace.onDidChangeTextDocument((event) => {
        const editor = vscode.window.activeTextEditor;
        if (editor && event.document === editor.document) {
            regexHighlighter.updateDecorations(editor);
        }
    }, null, context.subscriptions);

    vscode.window.onDidChangeTextEditorSelection((event) => {
        const editor = vscode.window.activeTextEditor;
        if (editor && editor === event.textEditor) {
            regexHighlighter.updateDecorations(editor);
        }
    }, null, context.subscriptions);
}

// this method is called when your extension is deactivated
export function deactivate() {}
