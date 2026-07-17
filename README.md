# Totally Secure Math App - Security Assessment Report

Authors: Aurora Choban, Jenna Hackett, Dylan Khuu, Stephen Noh, Verity Boyd
Date: 19 July, 2026

## I. Introduction

This report will provide a comprehensive security assessment on the Totally Secure Math App, including detailing the vulnerabilities found within the code of the application. Analysis on these vulnerabilities will be performed, implementations will be put in place within the code to fix them, and a final reflection will be given on the lessons learned during this assessment.

## II. Vulnerabilities Identified

### A. Insecure Data Storage:

User's passwords are hardcoded and stored as easily-breachable strings with no hashing or salting. Moreover, the passwords are stored within a suffix variable using unencrypted AsyncStorage within Notes.tsx; attackers are easily able to get access to these passwords.

### B. Improper Authentication:

Within Login.tsx, there is a severe lack of proper authentication. No tokens or other secure authentication methods are used - instead, the function just checks if the username and password are found in the array of users defined earlier. Because the login logic is entirely client-side with no backend authentication, an attacker would easily be able to bypass this and force the function to return true to gain access to the application.

What's more, is that the entire application has no access control, be it role-based or otherwise. Once a user is logged in, no further authorization checks are performed throughout the application, meaning if an attacker gained access to the application, they essentially have admin rights to perform further malicious attacks.

### C. Insufficient Input Validation & Code Injection:

These vulnerabilities are present throughout the application, and have been combined into one section of the report as they go hand in hand with another - if there is no input validation, code injection can easily be performed.

The TextInput field for password in the login form itself does not perform any sanitization or checking of what has been entered. This means an attacker could enter whatever code they want into the app to execute. If the app was attached to an SQL database, SQL could be entered to brute force a login. Moreover, an attacker could input an extremely long input to crash the app for a denial of service or buffer overflow attack.

More glaringly, the Note component of the app uses the eval() function on the note's contents. This function will execute anything entered within the note field. Again, this means attackers could enter JavaScript to display or execute anything they wanted to. The AddNote function only checks if the fields are empty, and does not perform any further sanitization or validation checks. This should be performed to at least check for the length of the input as well as any special characters to avoid an injection or XSS (cross-side scripting) attack. Seeing as the note is designed to contain a math equation, it would be a good idea to enforce some kind of whitelisting also so that the input is checked to be only numeric in nature.

### D. Insecure Coding Practices:

All of the features identified above come together to showcase the entire application as an example of insecure coding practices. Most notably, hardcoding passwords as plaintext strings, and not preventing any type of injection by way of a lack of input sanitization are to blame.
In addition, we noticed that the password field of the login form does not use secureTextEntry. This means that anyone looking at the user's screen can see the password entered as plain text. An attacker in the real world would easily be able to steal the user's credentials because of this.

## III. Why Security Implementations Matter (the ones we put in)

All the implementations were incredibly important to put into this project to ensure the safety and security of both the application and its users.

**a. Secure data storage.** Notes were previously written to `AsyncStorage` as plaintext JSON, and the storage key itself embedded the user's password hash. `AsyncStorage` is unencrypted on-device storage, readable by anyone with file-system or backup access to the device [1]. We now encrypt note content with AES before it is persisted, using a key derived specifically for that purpose via PBKDF2 from the user's password at login time (`Login.tsx`), rather than reusing the authentication hash as the encryption key. Reusing one secret across two purposes means a compromise of either purpose compromises both; deriving a distinct key with its own context string and iteration count avoids that coupling and matches guidance on key separation and password-based key derivation [2].

While manually verifying this fix on an Android emulator, we found that notes were not being persisted at all, encrypted or not: `storeNotes()` was only ever called from `componentWillUnmount()`, which fires when React unmounts the `Notes` screen, not when the OS backgrounds or kills the app. Since the app has no logout action and `Notes` is the only screen after login, nothing in normal usage ever unmounts it — confirmed by force-stopping the app after adding a note and inspecting the on-device AsyncStorage SQLite database directly, which showed zero rows written. This meant the storage vulnerability was effectively untestable and the note-taking feature silently failed to save data on every real device closure. We fixed this by having `addNote()` persist immediately after updating state, independent of the component lifecycle.

That fix surfaced a second, independent bug: with `storeNotes()` actually executing, every call failed with `Error: Native crypto module could not be used to get secure random number.` `CryptoJS.AES.encrypt()` generates a random IV internally, and that requires a secure random source; React Native has no built-in `crypto.getRandomValues`, so crypto-js's random-number call throws in this environment unless a native polyfill is installed. We added `react-native-get-random-values` and imported it as the very first line of `index.js` (it must run before crypto-js is used anywhere, including transitively), which backs `crypto.getRandomValues` with the platform's native secure RNG. This has a native module component, so it required a full rebuild, not just a Metro/JS reload. After both fixes, we re-verified end-to-end on the emulator: added a note, confirmed the ciphertext (`U2FsdGVkX1...`, crypto-js's salted-AES marker) was written to the on-device SQLite database under a key containing no password material, force-stopped the app, relaunched, logged back in, and confirmed the note reappeared and decrypted correctly.

**b. Authentication enhancement.** The original login compared plaintext passwords against an in-memory array with no hashing at all — trivial to read out of source or memory. Passwords are now hashed with a salted SHA-256 before comparison, and error messages were made generic so failed logins don't reveal whether the username or the password was wrong, which would otherwise let an attacker enumerate valid usernames [3]. This matters because credential-stuffing and enumeration attacks specifically target that kind of information leak.

**c. Input validation & code-injection prevention.** The `Note` component previously ran `eval()` on user-supplied note text, meaning any string a user typed into a "note" executed as live JavaScript in the app. This is functionally equivalent to a remote-code-execution primitive scoped to the app — an attacker who can get text into a note (their own, or shared/synced from another user in a future multi-user version) can run arbitrary code in that context [4]. We replaced `eval()` with a whitelist-validated arithmetic parser that has no code path back into the JavaScript engine, and added matching input validation (length caps, character whitelist) at the point notes are created, so invalid input is rejected before it is ever stored, not just before it is evaluated. Defense in depth here matters because relying on a single validation point means one missed edge case reopens the whole vulnerability.

**d. Secure coding practices.** Hardcoded plaintext credentials, unmasked password fields, and silent/absent error handling were all present in the original app. Beyond the specific fixes above, we made error handling explicit (e.g., catching invalid-equation and decryption failures instead of letting exceptions propagate or the app crash) and avoided introducing new hardcoded secrets when adding encryption. Insecure coding practices are dangerous specifically because they compound: a hardcoded secret is only exploitable once someone finds it, but the mindset that produces one hardcoded secret tends to produce several, across every part of an app [5].

## IV. Reflection

It is important to approach coding with a security-first mindset. Even when gathering requirements and designing architecture in the planning and analysis stages of a software project, it is key to consider security. The sooner you code with security in mind, the easier it will be to create a fully secure and protected application. Certain measures should become second nature, such as always sanitizing or specifying the input of text fields to avoid injection attacks. Furthermore, one should always consider the end-user and their security when writing code; whether its thinking about entering an unmasked password in a crowded environment, or considering how their life could be changed for the worse if you did not ensure their password was stored securely and out of reach of potential attackers. This consideration for the user that you are trying to protect will remind the programmer how instrumental security-first coding practices are.

A second lesson came from actually running the app rather than trusting the code by inspection: the note-persistence bug described in Section III(a) was invisible from reading `Notes.tsx` alone — the logic looked reasonable until we tried to save a note, closed the app the way a real user would, and reopened it. This reinforced that a security fix isn't done when the code compiles and looks right; it's done when you've watched it behave correctly end-to-end.

One limitation we recognize in our own fix: authentication passwords are hashed with a single static salt and one round of SHA-256. This is far better than plaintext, but SHA-256 is a fast hash designed for speed, not password storage, so it remains comparatively vulnerable to brute-force and rainbow-table attacks at scale, and a static (rather than per-user random) salt means all users share the same salt value. A production system should instead use a slow, purpose-built password hash such as bcrypt, scrypt, or Argon2 with a per-user random salt [6]. We are noting this rather than changing it in this submission, since fixing it would have meant re-deriving every credential-dependent value in the app, but it is the first thing we would change moving forward. More broadly, this project reinforced that "secure enough" is a moving target — every fix we made (encryption, input validation, safe evaluation) closed one specific hole, and the discipline that matters long-term is continuing to ask "what happens if this input is malicious" at every boundary, not just the ones an assignment happens to point at.

## V. References

[1] OWASP Foundation, "OWASP Mobile Application Security Verification Standard (MASVS)," 2023. [Online]. Available: https://mas.owasp.org/

[2] National Institute of Standards and Technology, "SP 800-132: Recommendation for Password-Based Key Derivation, Part 1: Storage Applications," NIST, Gaithersburg, MD, USA, 2010.

[3] OWASP Foundation, "Authentication Cheat Sheet," OWASP Cheat Sheet Series. [Online]. Available: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html

[4] MITRE, "CWE-95: Improper Neutralization of Directives in Dynamically Evaluated Code ('Eval Injection')," Common Weakness Enumeration. [Online]. Available: https://cwe.mitre.org/data/definitions/95.html

[5] MITRE, "CWE-798: Use of Hard-coded Credentials," Common Weakness Enumeration. [Online]. Available: https://cwe.mitre.org/data/definitions/798.html

[6] OWASP Foundation, "Password Storage Cheat Sheet," OWASP Cheat Sheet Series. [Online]. Available: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
