const { createServer } = require('node:http');
const fs = require('fs');
const path = require('path');

const hostname = '127.0.0.1';
const port = 3000;
const dataFilePath = path.join(__dirname, 'data', 'shopping-list.json');

// Create data directory if it doesn't exist
if (!fs.existsSync(path.dirname(dataFilePath))) {
  fs.mkdirSync(path.dirname(dataFilePath));
}

// Create initial JSON file if it doesn't exist
if (!fs.existsSync(dataFilePath)) {
  fs.writeFileSync(dataFilePath, JSON.stringify([])); // Initialize with an empty array
}

const server = createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/shopping-list') {
    // Read the shopping list
    fs.readFile(dataFilePath, 'utf8', (err, data) => {
      if (err) {
        res.statusCode = 500;
        return res.end('Error reading shopping list');
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(data); // Send the JSON data
    });
  } else if (req.method === 'POST' && req.url === '/shopping-list') {
    // Add a new item to the shopping list
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });

    req.on('end', () => {
      const newItem = JSON.parse(body);
      
      fs.readFile(dataFilePath, 'utf8', (err, data) => {
        if (err) {
          res.statusCode = 500;
          return res.end('Error reading shopping list');
        }

        const shoppingList = JSON.parse(data);
        shoppingList.push(newItem);

        fs.writeFile(dataFilePath, JSON.stringify(shoppingList, null, 2), (err) => {
          if (err) {
            res.statusCode = 500;
            return res.end('Error updating shopping list');
          }
          res.statusCode = 201;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(newItem)); // Return the added item
        });
      });
    });
  } else if (req.method === 'PUT' && req.url.startsWith('/shopping-list/')) {
    // Update an existing item
    const id = req.url.split('/')[2];
    let body = '';

    req.on('data', chunk => {
      body += chunk;
    });

    req.on('end', () => {
      const updatedItem = JSON.parse(body);

      fs.readFile(dataFilePath, 'utf8', (err, data) => {
        if (err) {
          res.statusCode = 500;
          return res.end('Error reading shopping list');
        }

        let shoppingList = JSON.parse(data);
        const index = shoppingList.findIndex(item => item.id === id);

        if (index !== -1) {
          shoppingList[index] = { ...shoppingList[index], ...updatedItem };

          fs.writeFile(dataFilePath, JSON.stringify(shoppingList, null, 2), (err) => {
            if (err) {
              res.statusCode = 500;
              return res.end('Error updating shopping list');
            }
            res.statusCode = 200;
            res.end(JSON.stringify(shoppingList[index])); 
          });
        } else {
          res.statusCode = 404;
          res.end('Item not found');
        }
      });
    });
  } else if (req.method === 'DELETE' && req.url.startsWith('/shopping-list/')) {
   
    const id = req.url.split('/')[2];

    fs.readFile(dataFilePath, 'utf8', (err, data) => {
      if (err) {
        res.statusCode = 500;
        return res.end('Error reading shopping list');
      }

      let shoppingList = JSON.parse(data);
      const index = shoppingList.findIndex(item => item.id === id);

      if (index !== -1) {
        shoppingList.splice(index, 1);

        fs.writeFile(dataFilePath, JSON.stringify(shoppingList, null, 2), (err) => {
          if (err) {
            res.statusCode = 500;
            return res.end('Error updating shopping list');
          }
          res.statusCode = 200;
          res.end('Item deleted');
        });
      } else {
        res.statusCode = 404;
        res.end('Item not found');
      }
    });
  } else {
    res.statusCode = 404;
    res.end('Not Found');
  }
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/shopping-list`);
});