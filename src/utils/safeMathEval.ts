/*
* Security Fix (Code Injection)
* - Note.tsx previously evaluated user-entered note text with eval(), which
*   executes arbitrary JavaScript rather than just arithmetic.
* - This module replaces eval() with a restricted arithmetic evaluator:
*   input is whitelist-validated, then tokenized and evaluated with a
*   recursive-descent parser. There is no code path back into the JS
*   interpreter, so no string can ever be "executed" as a script.
*/

// Only digits, a decimal point, the four basic operators, parentheses and
// whitespace are permitted. Anything else is rejected before parsing begins.
const ALLOWED_CHARACTERS = /^[0-9+\-*/(). \s]*$/;

type TokenType = 'number' | 'operator' | 'lparen' | 'rparen';

interface IToken {
	type: TokenType;
	value: string;
}

function tokenize(expression: string): IToken[] {
	const tokens: IToken[] = [];
	let i = 0;

	while (i < expression.length) {
		const char = expression[i];

		if (/\s/.test(char)) {
			i++;
			continue;
		}

		if (/[0-9.]/.test(char)) {
			let number = char;
			i++;
			while (i < expression.length && /[0-9.]/.test(expression[i])) {
				number += expression[i];
				i++;
			}
			if ((number.match(/\./g) || []).length > 1) {
				throw new Error('Invalid number format.');
			}
			tokens.push({ type: 'number', value: number });
			continue;
		}

		if ('+-*/'.includes(char)) {
			tokens.push({ type: 'operator', value: char });
			i++;
			continue;
		}

		if (char === '(') {
			tokens.push({ type: 'lparen', value: char });
			i++;
			continue;
		}

		if (char === ')') {
			tokens.push({ type: 'rparen', value: char });
			i++;
			continue;
		}

		throw new Error('Unexpected character in expression.');
	}

	return tokens;
}

// Recursive-descent parser implementing standard operator precedence:
// expression := term (('+' | '-') term)*
// term       := factor (('*' | '/') factor)*
// factor     := number | '(' expression ')' | '-' factor
class Parser {
	private tokens: IToken[];
	private position: number = 0;

	constructor(tokens: IToken[]) {
		this.tokens = tokens;
	}

	private peek(): IToken | undefined {
		return this.tokens[this.position];
	}

	private consume(): IToken {
		const token = this.tokens[this.position];
		if (!token) {
			throw new Error('Unexpected end of expression.');
		}
		this.position++;
		return token;
	}

	public parseExpression(): number {
		let value = this.parseTerm();

		while (this.peek()?.type === 'operator' && (this.peek()?.value === '+' || this.peek()?.value === '-')) {
			const op = this.consume().value;
			const right = this.parseTerm();
			value = op === '+' ? value + right : value - right;
		}

		return value;
	}

	private parseTerm(): number {
		let value = this.parseFactor();

		while (this.peek()?.type === 'operator' && (this.peek()?.value === '*' || this.peek()?.value === '/')) {
			const op = this.consume().value;
			const right = this.parseFactor();
			if (op === '/') {
				if (right === 0) {
					throw new Error('Division by zero.');
				}
				value = value / right;
			} else {
				value = value * right;
			}
		}

		return value;
	}

	private parseFactor(): number {
		const token = this.peek();

		if (!token) {
			throw new Error('Unexpected end of expression.');
		}

		if (token.type === 'operator' && token.value === '-') {
			this.consume();
			return -this.parseFactor();
		}

		if (token.type === 'number') {
			this.consume();
			const num = parseFloat(token.value);
			if (Number.isNaN(num)) {
				throw new Error('Invalid number.');
			}
			return num;
		}

		if (token.type === 'lparen') {
			this.consume();
			const value = this.parseExpression();
			const closing = this.consume();
			if (closing.type !== 'rparen') {
				throw new Error('Expected closing parenthesis.');
			}
			return value;
		}

		throw new Error('Unexpected token in expression.');
	}

	public assertFullyConsumed(): void {
		if (this.position !== this.tokens.length) {
			throw new Error('Unexpected trailing input.');
		}
	}
}

export function evaluateMathExpression(expression: string): number {
	if (!ALLOWED_CHARACTERS.test(expression)) {
		throw new Error('Expression contains disallowed characters.');
	}

	const tokens = tokenize(expression);

	if (tokens.length === 0) {
		throw new Error('Expression is empty.');
	}

	const parser = new Parser(tokens);
	const result = parser.parseExpression();
	parser.assertFullyConsumed();

	if (!Number.isFinite(result)) {
		throw new Error('Expression did not evaluate to a finite number.');
	}

	return result;
}
