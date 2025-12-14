
# IoT Door Entry System with Facial Recognition

### SD3B UDP 2025

**Authors:** Dylan Murphy, Matthew Tomkins, Oisin Bell, Oluwadamilare David Adekeye

## Context

This product is designed to be used at the entrance of an Airbnb property. Guests are going to use this system during their stay to securely access the property. This gives confidence to both the guest and the host that the property is secure and prevents unauthorised access.

## Description

The main goal of this project is to grant entry into an Airbnb securely using an NFC reader with a second layer of protection via facial recognition.

Guests will register through a companion mobile app before arrival. After booking, the guest downloads the app, registers their details, and uploads a photo. They then enter a unique booking code linked to their stay, which automatically syncs their information to the database. The app will display their booking details, check-in and check-out times, and provide the ability use NFC as their entrance method.

If the user matches the system, then it will release a door lock and grant entry into the Airbnb, logging when the person has entered the building and storing the information to the database.

If the keyfob ID is incorrect there will be a response from the system with an audible and visable alert notifying the user that entry failed. If the facial recogition fails or the product is tampered with an alert will be logged into the database, along with an alert to the host or property manager.

The system will be capable of logging all access events at the property and storing a log, along with a record of guests currently staying at the property.

## Want to access the website? Follow this

### Access App
```bash
https://www.hostlocksd3b.online
```
