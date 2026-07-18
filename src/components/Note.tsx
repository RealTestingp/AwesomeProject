import React from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import { evaluateMathExpression } from '../utils/safeMathEval';

interface IProps {
	title: string;
	text: string;
}

function Note(props: IProps) {
	/*
	* Security Fix (Code Injection)
	* - eval(props.text) executed whatever string was in the note as live
	*   JavaScript, not just arithmetic. Since notes are user-supplied, this
	*   was a textbook code-injection vector: someone could put something
	*   like AsyncStorage.getAllKeys() access, fetch(...), or an infinite
	*   loop into a note "equation" and it would run.
	* - Replaced with evaluateMathExpression(), a whitelist-validated
	*   arithmetic-only parser with no path back into eval/Function, so a
	*   malicious note can never execute as code. Invalid input throws and
	*   is surfaced to the user instead of executing or crashing the app.
	*/
	function evaluateEquation() {
		try {
			const result = evaluateMathExpression(props.text);
			Alert.alert('Result', 'Result: ' + result);
		} catch (error) {
			Alert.alert('Error', 'This note does not contain a valid equation.');
		}
	}

	return (
		<View style={styles.container}>
			<Text style={styles.title}>
				{props.title}
			</Text>
			<Text style={styles.text}>
				{props.text}
			</Text>

			<View style={styles.evaluateContainer}>
				<Button title='Evaluate' onPress={evaluateEquation} />
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		padding: 10,
		marginTop: 5,
		marginBottom: 5,
		backgroundColor: '#fff',
		borderRadius: 5,
		borderColor: 'black',
		borderWidth: 1
	},
	title: {
		fontSize: 18,
		fontWeight: 'bold'
	},
	text: {
		fontSize: 16,
	},
	evaluateContainer: {
		marginTop: 10,
		marginBottom: 10
	}
});

export default Note;