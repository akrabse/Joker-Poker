# Opzet en Installatie Handleiding

Deze handleiding is speciaal geschreven voor 5 HAVO en 6 VWO leerlingen voor hun examenjaar. Hierin leggen we stap voor stap uit hoe je je eigen website online zet met Vercel, hoe je je code opslaat met een GitHub account, en hoe je een database opstart met MongoDB. 

## 1. Een GitHub Account Aanmaken
GitHub is de plek waar je al je code opslaat (in zogenaamde 'repositories'). Dit zorgt ervoor dat je code veilig is, dat je versies kunt bijhouden, en dat je makkelijk met anderen kunt samenwerken.
- Ga naar [GitHub.com](https://github.com/) en klik op "Sign up".
- Volg de stappen om een account aan te maken.
- Download Git voor je computer en installeer het.
- **Tip (Video uitleg):** [Hoe maak je een GitHub account en gebruik je Git](https://www.youtube.com/results?search_query=github+tutorial+nederlands+beginners+git+push)

## 2. Een MongoDB Database Opstarten
Joker-Poker heeft een database nodig om bijvoorbeeld statistieken of gebruikersgegevens op te slaan. Hiervoor gebruiken we MongoDB.
- Ga naar [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) en maak een gratis account aan.
- Maak een nieuw cluster aan (kies de gratis 'Shared' tier).
- Voeg een database user toe (kies een veilig wachtwoord) en zet bij Network Access je IP-adres op de whitelist (of allow access from anywhere `0.0.0.0/0` voor testdoeleinden).
- Kopieer de "Connection String" (URI) om deze in je backend code te gebruiken.
- **Tip (Video uitleg):** [MongoDB Atlas Tutorial voor Beginners](https://www.youtube.com/results?search_query=mongodb+atlas+tutorial+for+beginners+nodejs)

## 3. Een Website Online Zetten met Vercel
Vercel is een platform waarmee je super snel je code online (live) kunt zetten.
- Ga naar [Vercel.com](https://vercel.com/) en log in met je git/GitHub account.
- Klik op "Add New..." -> "Project".
- Importeer je Joker-Poker repository (die je zojuist op GitHub hebt gezet).
- Vercel zal je code uitlezen en een unieke link genereren waarop jouw website live staat!
- **Tip (Video uitleg):** [Website hosten met Vercel in 5 minuten](https://www.youtube.com/results?search_query=deploy+website+on+vercel+tutorial)

## Leerbronnen: Beginnen met HTML en JavaScript
Als je je basiskennis voor je eindexamenjaar wilt opfrissen, begin dan met deze duidelijke video's:
- [Basis HTML & CSS Beginners Uitleg](https://www.youtube.com/results?search_query=html+css+cursus+nederlands+basis)
- [Basis JavaScript Leren in het Nederlands](https://www.youtube.com/results?search_query=javascript+uitleg+nederlands+beginners)

## Inspiratiebronnen voor een Hoger Cijfer
Wil je je website er professioneel uit laten zien voor een beter cijfer? Kijk dan eens naar deze links voor gave designs en effecten (neem ideeën over, maar kopieer niet blindelings):
- [CodePen Trending (Gave CSS/JS animaties en stukjes code)](https://codepen.io/trending?cursor=ZD0wJm89MCZwPTM2)
- [Liquid Technology (Strak zakelijk en modern design)](https://liquidtechnology.net/)
- [Lando Norris Website (Dynamisch, sportief en visueel indrukwekkend)](https://landonorris.com/)
