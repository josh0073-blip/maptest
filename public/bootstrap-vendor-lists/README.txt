Drop one or more CSV files in this folder to preload Template Library entries.

How it works:
- Each CSV file becomes one Template Library entry on app load.
- File name becomes the template name (for example: saturday-vendors.csv -> Saturday Vendors).
- The app syncs these folder-seeded templates on every launch:
  - add new CSV -> new template appears
  - update CSV content -> template updates
  - remove CSV -> template is removed

CSV format options:
- One name per line:
  Tomato Stand
  Bakery
  Cheese

- Header + active column:
  name,active
  Tomato Stand,true
  Bakery,false

Notes:
- Supported extension: .csv
- If a CSV produces no valid names, it is skipped.
