import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "regexhighlighter" is now active!');

	let disposable = vscode.commands.registerCommand('regexhighlighter.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from RegexHighlighter!');
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
