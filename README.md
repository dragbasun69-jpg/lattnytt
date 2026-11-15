# Lätt nytt

En nyhetssajt med nyheter på lätt svenska. Den uppdateras automatiskt varje timme, visar bilder och kan läsa upp nyheterna med enhetens svenska röst.

## Så kommer du igång (ca 10 minuter)

1. **Skapa ett nytt repo** på GitHub, t.ex. `lattnytt`. Välj *Public*.
2. **Ladda upp alla filer** från zip-filen (Add file → Upload files). Mappen `.github` måste följa med. Den är dold på Mac, så tryck `Cmd + Shift + .` i Finder för att se den. Säkrast är att dra in hela mappen.
3. **Slå på GitHub Pages:** Settings → Pages → under *Build and deployment* väljer du **Source: GitHub Actions**.
4. **Kör första uppdateringen:** fliken Actions → *Uppdatera nyheter* → **Run workflow**.
5. Efter någon minut finns sajten på `https://DITT-ANVÄNDARNAMN.github.io/lattnytt/`.

Sedan sköter den sig själv. Nyheterna hämtas 17 minuter över varje hel timme.

## Lägga till eller ta bort källor

Öppna `sources.json` och redigera listan. Varje källa behöver ett RSS-flöde:

```json
{ "id": "svtskane", "name": "SVT Skåne", "url": "https://www.svt.se/nyheter/lokalt/skane/rss.xml", "color": "#1d4e89", "enabled": true }
```

Sätt `"enabled": false` för att pausa en källa. När du sparar ändringen körs uppdateringen direkt.

## Uppläsningen

- Använder webbläsarens inbyggda röst. Det kostar inget och kräver ingen inloggning.
- Rösten låter olika på olika enheter. På iPhone och Mac brukar *Alva* eller *Klara* låta bäst. Saknas svensk röst går den att lägga till i enhetens inställningar under tal/uppläsning.
- Meningen som läses markeras med gult, så att man kan följa med i texten.
- Mellanslag pausar, Esc stoppar.

## Om upphovsrätt

Sajten visar bara rubrik, kort ingress och bild från flödena och länkar alltid till källan för hela texten. Det är samma princip som nyhetsappar och RSS-läsare använder. Kopiera inte in hela artiklar.

## Om något inte fungerar

- **Sajten är tom:** Kolla fliken Actions. Har körningen ett rött kryss, klicka på den och läs vad som står under *Hämta nyheter*.
- **En källa saknas:** Längst ner på sajten står vilka källor som inte gick att hämta. Flödesadressen kan ha ändrats.
- **GitHub pausar schemat** om repot inte haft någon aktivitet på 60 dagar. Nyhetsrobotens egna uppdateringar räknas oftast som aktivitet, men stannar det, gå till Actions och slå på det igen.

## Filer

| Fil | Vad den gör |
|---|---|
| `index.html`, `style.css`, `app.js` | Själva sajten |
| `sources.json` | Vilka nyhetskällor som används |
| `scripts/fetch-news.mjs` | Hämtar nyheterna och skriver `data/news.json` |
| `.github/workflows/update-news.yml` | Kör hämtningen varje timme och publicerar sajten |
