# Curriculum Map Builder

A free, open-source tool from [Waterdog Institute](https://waterdog.institute) for building a curriculum map and saving it as a clean, printable PDF.

**[Open the tool](https://tools.waterdog.institute/)**

## How to use it

1. Fill in your course details and units in the form on the left. The formatted map updates on the right as you type.
2. Use **+ Add unit**, **Move up / Move down**, and **Remove** to shape your units. List fields take one item per line.
3. Click **Download PDF** to download your map as a PDF. **Print** opens the browser's print window instead.
4. Click **Save map** to download a `.json` file of your map. Use **Open map** to load it again later and keep editing.

No installs, no accounts, and nothing is uploaded: everything runs in your browser. Your current map is also kept in your browser between visits.

## Map files

A saved map is a JSON file with:

- **Course details:** `course`, `grade`, `length`, `standards`, `author`, `description`
- **Units:** each with `title`, `weeks`, `big_idea`, and:
  - `key_standard`: one `{ code, text }`
  - `standards`: a list of `{ code, text }`
  - `essential_questions`: a list
  - **Knowledge:** `key_concepts`, a list of `{ name, description }`, and `vocabulary`, a list of terms (typed comma-separated, shown as bullets)
  - **Skills:** `skills`, a list of `{ type, name, description }`. The type is Receptive, Processing, Expressive, Physical, or a custom type you type in.
  - `activities`: learning activities, a list of `{ name, description }`
  - **Assessment:** `formative`, a list of `{ objective, description, artifact, artifact_description }` pairs, and `summative`, one such pair. The map shows the `objective` and `artifact` titles side by side. The descriptions are kept in the file for unit planning but aren't shown on the map.

You can type a standard's code and text separately, or paste a whole standard like `HS-ESS1-2 - Construct an explanation…` and it splits into code and text automatically.

The **key standard** is the standard a unit teaches to mastery, highlighted on the map. **Standards** are the others it touches. Maps saved in older formats are converted automatically when opened.

## License

Free and open source. Code is under the [MIT License](LICENSE). Written content is under [CC BY-SA 4.0](LICENSE-CONTENT.md).

PDFs are made with [pdfmake](http://pdfmake.org) (MIT License), included in [vendor/pdfmake](vendor/pdfmake).
