# Totally Secure Math App - Security Assessment Report

Authors: Aurora Choban, Jenna Hackett, Dylan Khuu, Stephen Noh, Verity Boyd
Date: 19 July, 2026

## I. Introduction

This report will provide a comprehensive security assessment on the Totally Secure Math App, including detailing the vulnerabilities found within the code of the application. Analysis on these vulnerabilities will be performed, implementations will be put in place within the code to fix them, and a final reflection will be given on the lessons learned during this assessment.

## II. Vulnerabilities Identified

### A. Insecure Data Storage:

User's passwords are hardcoded and stored as easily-breachable strings with no hashing or salting. Moreover, the passwords are stored within a suffix variable using unencrypted AsyncStorage within Notes.tsx, meaning attackers are easily able to get access to these passwords. These stolen credentials could then be used for account takeover within the app, or used in credential stuffing attacks against other services if users have reused their passwords elsewhere.

### B. Improper Authentication:

Within Login.tsx, there is a severe lack of proper authentication. No tokens or other secure authentication methods are used. Instead, the function just checks if the username and password are found in the array of users defined earlier. Because the login logic is entirely client-side with no backend authentication, an attacker would easily be able to bypass this and force the function to return true to gain access to the application.

Additionally, the entire application has no access control, be it role-based or otherwise. Once a user is logged in, no further authorization checks are performed throughout the application, meaning if an attacker gained access, they essentially have admin rights to perform further malicious attacks. An attacker could also modify or intercept the JavaScript bundle to bypass the login check entirely and force the function to return true without valid credentials.

### C. Insufficient Input Validation & Code Injection:

These vulnerabilities are present throughout the application, and have been combined into one section of the report as they go hand in hand with each other. If there is no input validation, code injection can easily be performed.

The TextInput field for password in the login form does not perform any sanitization or checking of what has been entered. This means an attacker could enter whatever code they want into the app to execute. If the app was attached to an SQL database, SQL could be entered to brute force a login. Moreover, an attacker could input an extremely long string to crash the app, resulting in a denial of service or buffer overflow attack.

The Note component of the app uses the eval() function on the note's contents. This function will execute anything entered within the note field, meaning attackers could enter JavaScript to display or execute anything they wanted to. The AddNote function only checks if the fields are empty, and does not perform any further sanitization or validation checks. This should be performed to at least check for the length of the input as well as any special characters to avoid an injection or XSS (cross-site scripting) attack. Seeing as the note is designed to contain a math equation, it would be a good idea to enforce some kind of whitelisting so that the input is checked to be only numeric in nature. An attacker could enter malicious JavaScript directly into the note field to execute arbitrary code, exfiltrate data, or install malware. This is known as Remote Code Execution (RCE).

### D. Insecure Coding Practices:

All of the features identified above come together to showcase the entire application as an example of insecure coding practices. Most notably, hardcoding passwords as plaintext strings and not preventing any type of injection by way of a lack of input sanitization are to blame.

In addition, we noticed that the password field of the login form does not use secureTextEntry. This means that anyone looking at the user's screen can see the password entered as plain text. An attacker in the real world would easily be able to steal the user's credentials because of this. The absence of proper error handling also means the application may expose internal logic or state information in error messages, which an attacker could use to better understand and exploit the system.

## III. Why Security Implementations Matter

The security implementations applied to this application were each critical to protecting both the integrity of the application and the privacy of its users.

Encrypting sensitive data and using secure storage methods ensures that even if an attacker gains access to the device's file system, the data they retrieve is unreadable without the decryption key. Storing passwords as plaintext is one of the most dangerous practices in software development. Proper hashing and salting ensures that even a full database breach does not immediately expose user credentials.

Implementing secure authentication practices, including token-based verification and server-side validation, ensures that the authentication process cannot be bypassed by manipulating client-side code. Access control is equally important. Without it, a single point of failure in authentication grants an attacker unrestricted access to the entire application.

Input validation and sanitization are the primary defenses against injection attacks. By strictly controlling what data the application will accept and process, the attack surface is dramatically reduced. Replacing eval() with a safe math parsing library eliminates the risk of Remote Code Execution entirely, as arbitrary code can no longer be passed to the interpreter through user input.

Finally, addressing insecure coding practices such as hardcoded credentials, unmasked password fields, and missing error handling brings the application in line with industry security standards. These practices protect users from both technical attacks and social engineering threats such as shoulder surfing, and ensure the application behaves predictably and securely under all conditions.

## IV. Reflection

It is important to approach coding with a security-first mindset. Even when gathering requirements and designing architecture in the planning and analysis stages of a software project, it is key to consider security. The sooner you code with security in mind, the easier it will be to create a fully secure and protected application. Certain measures should become second nature, such as always sanitizing or specifying the input of text fields to avoid injection attacks. Furthermore, one should always consider the end-user and their security when writing code, whether that means thinking about entering an unmasked password in a crowded environment, or considering how their life could be affected if their password was not stored securely and fell into the wrong hands. This consideration for the user that you are trying to protect will remind the programmer how important security-first coding practices truly are.

## V. References

[1] K. Sultan, "Module 5: Cross Platform Security," ITSC 320 – Software Security, Southern Alberta Institute of Technology, 2026.
