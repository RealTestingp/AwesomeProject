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

## II. Why Security Implementations Matter (the ones we put in)

All the implementations were incredibly important to put into this project to ensure the safety and security of both the application and its users. Write more later. Reference:
a. Modify the app to store sensitive data (e.g., API keys, access tokens) using appropriate encryption techniques and secure storage methods.
b. Implement secure authentication practices to address any improper authentication vulnerabilities.
c. Implement proper input validation and sanitization techniques to mitigate any insufficient input validation and code injection vulnerabilities.
d. Identify and rectify insecure code practices within the app, such as the use of hardcoded credentials, improper error handling or lack of access control.

## IV. Reflection

It is important to approach coding with a security-first mindset. Even when gathering requirements and designing architecture in the planning and analysis stages of a software project, it is key to consider security. The sooner you code with security in mind, the easier it will be to create a fully secure and protected application. Certain measures should become second nature, such as always sanitizing or specifying the input of text fields to avoid injection attacks. Furthermore, one should always consider the end-user and their security when writing code; whether its thinking about entering an unmasked password in a crowded environment, or considering how their life could be changed for the worse if you did not ensure their password was stored securely and out of reach of potential attackers. This consideration for the user that you are trying to protect will remind the programmer how instrumental security-first coding practices are.

## V. References

(None used.)
