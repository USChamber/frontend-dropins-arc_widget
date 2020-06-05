# ARC Widget Dropin 

## Description

A widget that displays photos from an associated Dropbox folder. This widget allows you to see the images, click on them, filter by state, email, and download images. 

## Usage

To use this on a page, add a `<p>` tag containing the text `__INSERT_PHOTO_WIDGET__` wherever you want the widget to appear. Then, add a script tag like so: 

```javascript
<script filepath="USMCA" src="https://uschamber-webassets.s3.amazonaws.com/uschamber.com/interactives/arc/index.js?v=5"></script>
```

The filepath supplied will determine which photos appear. These filepaths are relative to the root of the `/Applications/Advocacy Resource Center/` directory in the main user's dropbox folder. This folder cannot be shared, but subfolders can be. 

### Supported File Types

This widget accepts any file type that works with the `img` HTML5 tag. That said, the backend for this only supports mainstream image formats like jpg, jpeg, png, and gif. 

### State-specific images

This application looks at each image file's name to determine if any state-specific images are present. It looks for the full state name (with space or underscore separation e.g. michigan, new_hampshire, west virginia) and/or the state abbreviation (surrounded by underscores e.g. \_AZ_, \_ME_).

The following table shows how some example filenames would be processed. 

| Filename                                | Classification | Notes                                                                                                                                                                            |
| --------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| usmca_01_problems in Michigan arise.jpg | "Michigan"     | can handle spaces and underscores in filename                                                                                                                                    |
| usmca_01_problems in michigan arise.jpg | "Michigan"     | interpretation is case insensitive                                                                                                                                               |
| usmca_01_mi_problems.jpg                | "Michigan"     | Understands abbreviations within underscores                                                                                                                                     |
| usmca 222035 virginia problems.jpg      | "Virginia"     | If a trouble state like "virginia" or "kansas" are found (where they are subsets of other states) the system will verify that it there is no "west" or "ar" in the name as well. |
| usmca_01_missing_numbers.jpg            | "General"      | Ignores the "mi" because it is not preceded and succeeded by `_`                                                                                                                 |


## Development

* `$ git clone git@github.com:USChamber/frontend-dropins-arc_widget.git arc_widget`
* `$ cd arc_widget`
* `$ npm install`
* `$ npm start`
* Navigate to the localhost address given in the command line logging

## Deployment

* `$ npm run build`
* `$ npm run deploy`