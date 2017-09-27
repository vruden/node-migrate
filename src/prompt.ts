/**
 * @param question
 * @param {(err: any, answer: boolean) => void} callback
 */
import Socket = NodeJS.Socket;

export const confirm = function (question, callback: (err: Error, answer: boolean) => void): void {
    const stdin: Socket = process.openStdin();

    stdin.addListener('data', fn);

    askQuestion();

    function fn (answer: string): void {
        answer = answer.toString().trim();

        if (!answer || answer === 'n' || answer === 'no') {
            stdin.removeListener('data', fn);
            callback(null, false);
        } else if (answer === 'y' || answer === 'yes') {
            stdin.removeListener('data', fn);
            callback(null, true);
        } else {
            askQuestion();
        }
    }

    function askQuestion(): void {
        process.stdout.write(question + ' (yes|no) [no]:');
    }
};