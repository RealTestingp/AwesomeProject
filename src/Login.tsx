import React from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import CryptoJS from 'crypto-js';
import { TRootStackParamList } from './App';

export interface IUser {
	username: string;
	password: string;
}

interface IProps {
	onLogin: (user: IUser) => void;
}

type TProps = NativeStackScreenProps<TRootStackParamList, 'Login'> & IProps;

/*
* Security Changes
* - Password was stored as plaintext in the array
* - Now it is hashed with SHA-256 and salted before being stored.
*/
const SALT = 'AwesomeProject-static-salt-v1';

function hashPassword(plainText: string): string {
	return CryptoJS.SHA256(SALT + plainText).toString(CryptoJS.enc.Hex);
}

const users: IUser[] = [
	{ username: 'joe', password: hashPassword('secret') },
	{ username: 'bob', password: hashPassword('password') },
];

/*
* Security Changes
* - Username was stored as plaintext in the array
* - Now it is validated before any comparison happens.
* - MAX_PASSWORD_LENGTH is now a hard cap to reject long input.
* - Reject empty/long passwords before hashing/comparing
* - Error messages are now generic to avoid giving hints to attackers.
*/
const USERNAME_PATTERN = /^[a-zA-Z0-9_]{1,32}$/;
const MAX_PASSWORD_LENGTH = 128;

export default function Login(props: TProps) {
	const [username, setUsername] = React.useState('');
	const [password, setPassword] = React.useState('');

	function login() {
		const cleanUsername = username.trim();

		if (!USERNAME_PATTERN.test(cleanUsername)) {
			Alert.alert('Error', 'Username or password is invalid.');
			return;
		}

		if (password.length === 0 || password.length > MAX_PASSWORD_LENGTH) {
			Alert.alert('Error', 'Username or password is invalid.');
			return;
		}

		/*
		* Security Fix (Improper Authentication)
		* - Compare the SHA-256 hash of the entered password against the stored hash
		* - Removes the plaintext-comparison vulnerability
		* - Clear password after login attempt to avoid keeping it in memory.
		*/
		const enteredHash = hashPassword(password);

		let foundUser: IUser | false = false;

		for (const user of users) {
			if (cleanUsername === user.username && enteredHash === user.password) {
				foundUser = user;
				break;
			}
		}

		if (foundUser) {
			props.onLogin(foundUser);
		} else {
			Alert.alert('Error', 'Username or password is invalid.');
		}

		setPassword('');
	}

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Login</Text>
			<TextInput
				style={styles.username}
				value={username}
				onChangeText={setUsername}
				placeholder="Username"
				autoCapitalize="none"
				autoCorrect={false}
				maxLength={32}
			/>
			<TextInput
				style={styles.password}
				value={password}
				onChangeText={setPassword}
				placeholder="Password"
				secureTextEntry={true}
				autoCapitalize="none"
				autoCorrect={false}
				maxLength={MAX_PASSWORD_LENGTH}
			/>
			<Button title="Login" onPress={login} />
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
		backgroundColor: '#fff',
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 20,
	},
	username: {
		borderWidth: 1,
		borderColor: '#ccc',
		padding: 10,
		marginBottom: 10,
	},
	password: {
		borderWidth: 1,
		borderColor: '#ccc',
		padding: 10,
		marginBottom: 10,
	}
});