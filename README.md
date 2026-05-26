# Info_Systems_Dev_Methodologies

This README acts as a guide on the installation of the app developed by our student team as an assignement by our university.

1. ΡΥΘΜΙΣΗ ΒΑΣΗΣ ΔΕΔΟΜΕΝΩΝ
----------------------------------------------------------------
Βήμα 1: Εκκίνηση XAMPP
  Ανοίξτε τον XAMPP Control Panel και εκκινήστε τις υπηρεσίες
  Apache και MySQL.

Βήμα 2: Δημιουργία Βάσης Δεδομένων
  Ανοίξτε τον browser και μεταβείτε στη διεύθυνση:
    http://localhost/phpmyadmin

  Στο phpMyAdmin:
    - Επιλέξτε "Import" από το επάνω μενού
    - Κάντε κλικ στο "Choose File"
    - Επιλέξτε το αρχείο setup.sql από τον φάκελο backend
    - Κάντε κλικ στο "Go"

  Αυτό δημιουργεί αυτόματα τη βάση δεδομένων
  "city_problem_reporting" με όλους τους απαραίτητους πίνακες
  (users, categories, reports).


2. ΕΓΚΑΤΑΣΤΑΣΗ & ΕΚΚΙΝΗΣΗ
----------------------------------------------------------------
Βήμα 1: Εγκατάσταση εξαρτήσεων Backend
  Ανοίξτε τερματικό (Command Prompt ή PowerShell), μεταβείτε
  στον φάκελο ERGASIA και εκτελέστε:

    > npm install

  ΣΗΜΑΝΤΙΚΟ: Ακόμα και αν ο φάκελος node_modules υπάρχει ήδη,
  συνιστάται να τον διαγράψετε πρώτα και να εκτελέσετε εκ νέου
  npm install. Η βιβλιοθήκη bcrypt χρησιμοποιεί μεταγλωττισμένο
  (compiled) κώδικα που είναι δεμένος με τον υπολογιστή στον
  οποίο εγκαταστάθηκε. Αν αντιγραφεί από άλλον υπολογιστή, δεν
  θα λειτουργεί και θα εμφανίζεται "Internal server error" κατά
  τη σύνδεση ή εγγραφή χρηστών.

Βήμα 2: Δημιουργία λογαριασμού διαχειριστή
  Εκτελέστε:

    > node seed.js

  Στοιχεία σύνδεσης διαχειριστή:
    Email   : admin@gmail.com
    Κωδικός : admin123

Βήμα 3: Εκκίνηση Server
  Εκτελέστε:

    > node app.js

  Ο server θα εκκινήσει στη διεύθυνση: http://localhost:3000

Βήμα 4: Πρόσβαση στην Εφαρμογή
  Ανοίξτε τον browser και μεταβείτε στη διεύθυνση:
    http://localhost:3000

  Το frontend φορτώνεται αυτόματα από τον ίδιο server.
