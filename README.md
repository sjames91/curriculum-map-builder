# Curriculum Map Builder

A free, open-source tool from [Waterdog Institute](https://waterdog.institute) that turns a curriculum map into a clean, printable PDF.

**[Open the tool](https://tools.waterdog.institute/)**

## How to use it

1. Open the tool. It starts with a sample Earth Science map.
2. Click **Open map** to load your own map file (`.json`).
3. Click **Download PDF**, then choose **Save as PDF** in the print window.
4. Click **Save map** to download the map file so you can edit it later.

No installs, no accounts, and nothing is uploaded: everything runs in your browser.

## Map files

A map is a JSON file. See [maps/earth-science.json](maps/earth-science.json) for the format:

- **Course details:** `course`, `grade`, `author`, `length`, `standards`, `description`
- **Units:** each with `title`, `weeks`, `big_idea`, and lists of `essential_questions`, `standards`, `key_concepts`, `vocabulary`, `activities`, `assessments`

## Running it locally

Because the page loads the sample map with `fetch`, open it through a local web server rather than double-clicking `index.html`.

## License

Free and open source. Code is under the [MIT License](LICENSE). Written content, including the sample maps, is under [CC BY-SA 4.0](LICENSE-CONTENT.md).
