# ARC Widget Dropin

## Description

A widget that displays photos from an associated Dropbox folder. This widget allows you to see the images, click on them, filter by state, email, and download images.

## Usage

To use this on a page, add a `<p>` tag containing the text `__INSERT_PHOTO_WIDGET__` wherever you want the widget to appear. Then, add a script tag like so:

```javascript
<script
  filepath="USMCA"
  src="https://uschamber-webassets.s3.amazonaws.com/uschamber.com/interactives/arc/index.js?v=5"
></script>
```

The filepath supplied will determine which photos appear. These filepaths are relative to the root of the `/Applications/Advocacy Resource Center/` directory in the main user's dropbox folder. This folder cannot be shared, but subfolders can be.

### Supported File Types

This widget accepts any file type that works with the `img` HTML5 tag. That said, the backend for this only supports mainstream image formats like jpg, jpeg, png, and gif.

### State-specific images

This application looks at each image file's name to determine if any state-specific images are present. It looks for the full state name (with space or underscore separation e.g. michigan, new*hampshire, west virginia) and/or the state abbreviation (surrounded by underscores e.g. \_AZ*, \_ME\_).

The following table shows how some example filenames would be processed.

| Filename                                | Classification | Notes                                                                                                                                                                            |
| --------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| usmca_01_problems in Michigan arise.jpg | "Michigan"     | can handle spaces and underscores in filename                                                                                                                                    |
| usmca_01_problems in michigan arise.jpg | "Michigan"     | interpretation is case insensitive                                                                                                                                               |
| usmca_01_mi_problems.jpg                | "Michigan"     | Understands abbreviations within underscores                                                                                                                                     |
| usmca 222035 virginia problems.jpg      | "Virginia"     | If a trouble state like "virginia" or "kansas" are found (where they are subsets of other states) the system will verify that it there is no "west" or "ar" in the name as well. |
| usmca_01_missing_numbers.jpg            | "General"      | Ignores the "mi" because it is not preceded and succeeded by `_`                                                                                                                 |

### Search

The search algorithm is agnostic to ordering and case. So for example, if you save a file as:

`leadership_award_matt-BLOOMFIELD_2020.jpg`

A user could find that image by searching any of the following (and more permuations not listed)

- Bloomfield
- Matt Leadership
- Matt bloomfield award
- Leadership bloomfield

You can enable the search functionality by including ‘search’ as an attribute on the script tag. E.g.

```html
<script src=”/path/to/script” filename=”awards” search></script>
```

If you would like to customize the placeholder text you can add it as a value on the attribute:

```html
<script src=”/path/to/script” filename=”awards” search="Search here..."></script>
```

### Custom Filters

To add custom dropdown filters you will need to modify the filenames and then supply the script with the filter names as attributes.

For example, if you want a filters for Award and Recipient, you could save your files like so:

- `Recipient|Jimmy_Dean-Award|Humility.jpg`
- `Recipient|Jane_Smith-Award|Honor.jpg`
- `Recipient|John_Doe-Award|Leadership.jpg`
- `Recipient|Alex_Hamilton-Award|Leadership.jpg`

Then in your HTML you would add a `filters` attribute with a comma separated list of filters. Note that you should use underscores in place of spaces. These will be replaced. Also, case matters.

```html
<script
  src="./index.js"
  search
  filepath="dir-name"
  filters="Recipient,Award"
></script>
```

Once you have the pieces in place, the app will read the filenames to and populate the filter dropdowns with the values supplied. Duplicates will be handled appropriately.

While you may supply as many filters as you want, end users will only be able to use a single filter at a time. Filters can be used in conjunction with search.

### Suppressing Elements

There is a kind of experimental attribute you can supply called `hidden-elements`. Currently it only supports the value "StateSpecific". This will not extract the StateSpecific images into the General section, simply hide the entire div (or keep it from being created).

## Development

- `$ git clone git@github.com:USChamber/frontend-dropins-arc_widget.git arc_widget`
- `$ cd arc_widget`
- `$ npm install`
- `$ npm start`
- Navigate to the localhost address given in the command line logging

## Deployment

- `$ npm run build`
- `$ npm run deploy`
