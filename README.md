# Curriculum Map Builder

A free, open-source tool from [Waterdog Institute](https://waterdog.institute) for building a curriculum map and saving it as a clean, printable PDF.

**[Open the tool](https://tools.waterdog.institute/)**

## How to use it

1. Fill in your course details and units in the form on the left. The formatted map updates on the right as you type.
2. Use **+ Add unit**, **Move up / Move down**, and **Remove** to shape your units. List fields take one item per line.
3. Click **Download PDF**, then choose **Save as PDF** in the print window.
4. Click **Save map** to download a `.json` file of your map. Use **Open map** to load it again later and keep editing.

No installs, no accounts, and nothing is uploaded: everything runs in your browser. Your current map is also kept in your browser between visits.

## Map files

A saved map is a JSON file with:

- **Course details:** `course`, `grade`, `length`, `standards`, `author`, `description`
- **Units:** each with `title`, `weeks`, `big_idea`, and:
  - `key_standard`: one `{ code, text }`
  - `standards`: a list of `{ code, text }`
  - `essential_questions`: a list
  - **Knowledge:** `key_concepts`, `vocabulary` (lists)
  - **Skills:** `skills_receptive`, `skills_processing`, `skills_expressive`, `skills_physical` (lists)
  - `activities`: a list of learning activities
  - **Assessment:** `formative`, a list of `{ objective, artifact }` pairs, and `summative`, one `{ objective, artifact }` pair

The **key standard** is the standard a unit teaches to mastery, highlighted on the map. **Standards** are the others it touches. Maps saved in older formats are converted automatically when opened.

## License

Free and open source. Code is under the [MIT License](LICENSE). Written content is under [CC BY-SA 4.0](LICENSE-CONTENT.md).
