import React from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import CryptoJS from 'crypto-js';
import { TRootStackParamList } from './App';

export interface IUser {
	username: string;
	password: string;
	/*
	* Security Fix (Insecure Data Storage)
	* - Notes.tsx used to build its AsyncStorage encryption/key material
	*   directly from `password` (the auth hash), reusing the same secret
	*   for two different purposes.
	* - notesKey is a separate value, derived via PBKDF2 from the plaintext
	*   password at login time (see deriveNotesKey below) using a different
	*   salt/context than the auth hash, so compromising one does not
	*   automatically compromise the other.
	*/
	notesKey: string;
}

// Shape of the local "database" entries: only what's needed to authenticate.
// notesKey is deliberately absent here — it only ever exists transiently,
// derived from the plaintext password at the moment of a successful login.
interface IStoredUser {
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

/*
* Security Fix (Insecure Data Storage)
* - Derives a key for encrypting a user's notes (see Notes.tsx) from their
*   plaintext password via PBKDF2, using a distinct context string and a
*   high iteration count.
* - This is intentionally NOT the same value as the auth hash above: reusing
*   one secret for both authentication and encryption means a leak of either
*   purpose compromises the other. PBKDF2's iteration count also makes this
*   far more brute-force-resistant than a single SHA-256 pass.
*/
const NOTES_KEY_CONTEXT = 'AwesomeProject-notes-encryption-v1';

function deriveNotesKey(plainTextPassword: string, username: string): string {
	return CryptoJS.PBKDF2(plainTextPassword, NOTES_KEY_CONTEXT + username, {
		keySize: 256 / 32,
		iterations: 10000,
	}).toString(CryptoJS.enc.Hex);
}

const users: IStoredUser[] = [
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

		let foundUser: IStoredUser | false = false;

		for (const user of users) {
			if (cleanUsername === user.username && enteredHash === user.password) {
				foundUser = user;
				break;
			}
		}

		if (foundUser) {
			/*
			* Security Fix (Insecure Data Storage)
			* - notesKey must be derived here, while the plaintext `password`
			*   is still in memory, since it is cleared immediately below and
			*   never stored or passed onward in plaintext form.
			*/
			const notesKey = deriveNotesKey(password, foundUser.username);
			props.onLogin({ username: foundUser.username, password: foundUser.password, notesKey });
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