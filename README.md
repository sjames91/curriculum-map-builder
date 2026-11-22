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
- **Units:** each with `title`, `weeks`, `big_idea`, and lists of:
  - `key_standards`, `standards`, `essential_questions`
  - **Knowledge:** `key_concepts`, `vocabulary`
  - **Skills:** `skills_receptive`, `skills_processing`, `skills_expressive`, `skills_physical`
  - `activities` (learning activities)
  - **Assessment:** `formative_objectives`, `formative_artifacts`, `summative_objectives`, `summative_artifacts`

**Key standards** are the few standards a unit teaches to mastery. **Standards** are the others it touches. Key standards are highlighted on the map.

## License

Free and open source. Code is under the [MIT License](LICENSE). Written content is under [CC BY-SA 4.0](LICENSE-CONTENT.md).
