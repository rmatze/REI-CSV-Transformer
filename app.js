const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.static('public'));

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/download/template.csv', (req, res) => {
  const templateFilePath = path.join(__dirname, 'download', 'template.csv'); // Adjust the path to match your file location
  res.sendFile(templateFilePath);
});

app.post('/transform', upload.single('csvFile'), (req, res) => {
  const inputFilePath = req.file.path;
  const outputFilePath = 'output.csv';

  // const userFormat = "####-###-##-####"; //req.body.formatString; // Retrieve the user-specified format

  const header = ['APN#', 'County', 'State'];
  // const selectedColumns = [];

  // fs.createReadStream(inputFilePath)
  //   .pipe(csv())
  //   .on('data', (row) => {
  //     selectedColumns.push({
  //       APN: formatString(row.APN, userFormat),
  //       COUNTY: row.County,
  //       STATE: row.State,
  //     });
  //   })
  //   .on('end', () => {
  //     if (selectedColumns.length > 0) {
  //       const csvContent = header.join(',') + '\n' +
  //         // selectedColumns.map((row) => `${row.APN},${row.STATE},${row.COUNTY}`).join('\n');
  //         selectedColumns.map((row) => `${row.APN},San Bernardino,CA`).join('\n');

  //       fs.writeFileSync(outputFilePath, csvContent);
  //       res.download(outputFilePath, 'output.csv');
  //     } else {
  //       res.send('No data found for selected columns.');
  //     }
  //   });


  const data = [];

  fs.createReadStream(inputFilePath)
    .pipe(csv())
    .on('data', (row) => {
      data.push(row);
    })
    .on('end', () => {
      if (data.length > 0) {
        // const header = Object.keys(data[0]);
        
        // Create a map of APNs
        const apnMap = new Map();
        data.forEach((row) => {
          apnMap.set(row.APN, row.STATE);
        });

        sortedApnMap = new Map([...apnMap.entries()].sort((a, b) => b[0] - a[0]));

        // Generate CSV content
        const csvContent = header.join(',') + '\n' +
          Array.from(sortedApnMap, ([apn, state]) => `${apn},San Bernardino,CA`).join('\n');

        fs.writeFileSync(outputFilePath, csvContent);
        res.download(outputFilePath, 'output.csv');
      } else {
        res.send('CSV file is empty.');
      }
    });
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});

// function formatString(input, format) {
//   if (input.length !== 10) {
//     throw new Error('Input string must have exactly 10 characters.');
//   }

//   return `${input.substring(0, 3)}-${input.substring(3, 5)}-${input.substring(5, 7)}-${input.substring(7)}`;
// }

function formatString(input, format) {
  let count = countHashes(format)
  if (input.length !== count) {
    console.log(`Input string must have exactly ${count} characters.`);
    return input;
  }

  let formattedString = '';
  let j = 0;
  for (let i = 0; i < format.length; i++) {
    if (format[i] === '#') {
      formattedString += input[j];
      j++;
    } else {
      formattedString += format[i];
    }
  }

  return formattedString;
}

function countHashes(str) {
  let count = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '#') {
      count++;
    }
  }
  return count;
}
