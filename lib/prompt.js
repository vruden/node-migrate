"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirm = void 0;
const confirm = function (question, callback) {
    const stdin = process.openStdin();
    stdin.addListener('data', fn);
    askQuestion();
    function fn(answer) {
        answer = answer.toString().trim();
        if (!answer || answer === 'n' || answer === 'no') {
            stdin.removeListener('data', fn);
            callback(null, false);
        }
        else if (answer === 'y' || answer === 'yes') {
            stdin.removeListener('data', fn);
            callback(null, true);
        }
        else {
            askQuestion();
        }
    }
    function askQuestion() {
        process.stdout.write(question + ' (yes|no) [no]:');
    }
};
exports.confirm = confirm;
