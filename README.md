Very simple vanilla JS YouTube search which has some filters that don't appear
on the official YT site. This search promotes long videos and can filter
them by published date.

# Usage

You'll need to obtain the YT API key (it's free to some extent, you just need
to register) and create `config.js` file.

```javascript
export const YT_API_KEY = '<your API key>';
```

Then, start the server:

```bash
$ python3 -m http.server
```

and simply go to `localhost:8000`.

### Local static site

You can obviously just put the `YT_API_KEY` inside the `main.js` and open
`index.html` in the browser without running the server.

# Options

* **Min. duration**: this will show the videos with the duration at least `n` minutes long
* **Page count**: there are 50 results per page, each page is one search request + statistics request; one page is the default
* **Published before**: show videos published before a certain date
* **Published after**: show videos published after a certain date
