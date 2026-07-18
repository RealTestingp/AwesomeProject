import React from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, SafeAreaView, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';
import Note from './components/Note';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TRootStackParamList } from './App';

export interface INote {
	title: string;
	text: string;
}

interface IProps {
}

interface IState {
	notes: INote[];
	newNoteTitle: string;
	newNoteEquation: string;
}

type TProps = NativeStackScreenProps<TRootStackParamList, 'Notes'> & IProps;

/*
* Security Changes (Insufficient Input Validation)
* - addNote() previously only checked for empty strings.
* - MAX_TITLE_LENGTH / MAX_EQUATION_LENGTH cap input size to prevent
*   oversized-payload abuse.
* - EQUATION_PATTERN whitelists exactly the character set the safe math
*   evaluator (see components/Note.tsx / utils/safeMathEval.ts) accepts, so
*   invalid or malicious content is rejected at entry time rather than only
*   at evaluation time (defense in depth).
*/
const MAX_TITLE_LENGTH = 50;
const MAX_EQUATION_LENGTH = 200;
const EQUATION_PATTERN = /^[0-9+\-*/(). ]+$/;

export default class Notes extends React.Component<TProps, IState> {
	constructor(props: Readonly<TProps>) {
		super(props);

		this.state = {
			notes: [],
			newNoteTitle: '',
			newNoteEquation: ''
		};

		this.onNoteTitleChange = this.onNoteTitleChange.bind(this);
		this.onNoteEquationChange = this.onNoteEquationChange.bind(this);
		this.addNote = this.addNote.bind(this);
	}

	public async componentDidMount() {
		const existing = await this.getStoredNotes();

		this.setState({ notes: existing });
	}

	/*
	* Security Fix (Insecure Data Storage)
	* - Notes were previously stored as plaintext JSON in AsyncStorage, and
	*   the storage key embedded the user's password hash directly in a key
	*   *name* (readable in logs/backups/storage inspection tools).
	* - The key name is now namespaced by username alone; all sensitive
	*   material lives only in the AES-encrypted payload, never in the key.
	* - Note content is encrypted with AES using notesKey (see Login.tsx),
	*   a key derived from the password specifically for this purpose and
	*   never persisted anywhere itself.
	*/
	private async getStoredNotes(): Promise<INote[]> {
		const { username, notesKey } = this.props.route.params.user;

		const cipherText = await AsyncStorage.getItem('notes-' + username);

		if (cipherText === null) {
			return [];
		}

		try {
			const bytes = CryptoJS.AES.decrypt(cipherText, notesKey);
			const jsonValue = bytes.toString(CryptoJS.enc.Utf8);
			return JSON.parse(jsonValue);
		} catch (error) {
			// Wrong key or corrupted/tampered data: fail closed rather than
			// throwing or returning garbage.
			return [];
		}
	}

	private async storeNotes(notes: INote[]) {
		const { username, notesKey } = this.props.route.params.user;

		const jsonValue = JSON.stringify(notes);
		const cipherText = CryptoJS.AES.encrypt(jsonValue, notesKey).toString();
		await AsyncStorage.setItem('notes-' + username, cipherText);
	}

	private onNoteTitleChange(value: string) {
		this.setState({ newNoteTitle: value });
	}

	private onNoteEquationChange(value: string) {
		this.setState({ newNoteEquation: value });
	}

	/*
	* Bug Fix (Insecure Data Storage — verified during manual testing)
	* - Notes were only ever written to AsyncStorage from
	*   componentWillUnmount(), which fires when React unmounts this
	*   screen, not when the OS backgrounds/kills the app. Since there is
	*   no in-app action that unmounts Notes (no logout, single-screen
	*   stack), notes never actually reached storage under real usage —
	*   confirmed by force-stopping the app after adding a note and
	*   inspecting the on-device AsyncStorage database directly, which
	*   showed no rows written.
	* - addNote() now persists immediately after updating state, so every
	*   note is written to encrypted storage as soon as it's added,
	*   independent of the screen's mount lifecycle.
	*/
	private async addNote() {
		const title = this.state.newNoteTitle.trim();
		const text = this.state.newNoteEquation.trim();

		if (title === '' || text === '') {
			Alert.alert('Error', 'Title and equation cannot be empty.');
			return;
		}

		if (title.length > MAX_TITLE_LENGTH) {
			Alert.alert('Error', `Title must be ${MAX_TITLE_LENGTH} characters or fewer.`);
			return;
		}

		if (text.length > MAX_EQUATION_LENGTH) {
			Alert.alert('Error', `Equation must be ${MAX_EQUATION_LENGTH} characters or fewer.`);
			return;
		}

		if (!EQUATION_PATTERN.test(text)) {
			Alert.alert('Error', 'Equation may only contain numbers, spaces, and + - * / ( ) . characters.');
			return;
		}

		const note: INote = { title, text };
		const notes = this.state.notes.concat(note);

		this.setState({
			notes,
			newNoteTitle: '',
			newNoteEquation: ''
		});

		await this.storeNotes(notes);
	}

	public render() {
		return (
			<SafeAreaView>
				<ScrollView contentInsetAdjustmentBehavior="automatic">
					<View style={styles.container}>
						<Text style={styles.title}>
							{'Math Notes: ' + this.props.route.params.user.username}
						</Text>
						<TextInput
							style={styles.titleInput}
							value={this.state.newNoteTitle}
							onChangeText={this.onNoteTitleChange}
							placeholder="Enter your title"
							maxLength={MAX_TITLE_LENGTH}
						/>
						<TextInput
							style={styles.textInput}
							value={this.state.newNoteEquation}
							onChangeText={this.onNoteEquationChange}
							placeholder="Enter your math equation"
							maxLength={MAX_EQUATION_LENGTH}
						/>
						<Button title="Add Note" onPress={this.addNote} />

						<View style={styles.notes}>
							{this.state.notes.map((note, index) => (
								<Note key={index} title={note.title} text={note.text} />
							))}
						</View>
					</View>
				</ScrollView>
			</SafeAreaView>
		);
	}
}

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
	titleInput: {
		borderWidth: 1,
		borderColor: '#ccc',
		padding: 10,
		marginBottom: 10,
	},
	textInput: {
		borderWidth: 1,
		borderColor: '#ccc',
		padding: 10,
		marginBottom: 10,
	},
	notes: {
		marginTop: 15
	},
});