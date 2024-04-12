const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

const logFilePath = path.join(__dirname, 'transactionsLog.txt');

const appendLog = (message) => {
  fs.appendFileSync(logFilePath, message + '\n', 'utf8');
};

const startsWithAmount = (transactionAmount, startAmount) => {
  const transactionAmountStr = transactionAmount.toString();
  const startAmountStr = startAmount.toString();
  return transactionAmountStr.startsWith(startAmountStr);
};

// route for tx
app.post('/api/transactions', async (req, res) => {
  const { symbol = '', exactTokenAmountStart = '', page = 0, address = 'wormhole14ejqjyq8um4p3xfqj74yld5waqljf88fz25yxnma0cngspxe3les00fpjx', pageSize = 999 } = req.body;
  const apiUrl = `https://api.wormholescan.io/api/v1/transactions/?address=${address}&pageSize=${pageSize}&page=${page}`;

  try {
    const response = await axios.get(apiUrl);
    const transactions = response.data.transactions;
    const filteredTransactions = transactions.filter(transaction => {
      const matchesSymbol = symbol ? transaction.symbol === symbol : true;
      const matchesAmount = exactTokenAmountStart ? startsWithAmount(parseFloat(transaction.tokenAmount), parseFloat(exactTokenAmountStart)) : true;
      return matchesSymbol && matchesAmount;
    });

    res.json(filteredTransactions);
  } catch (error) {
    console.error(`Error fetching transactions for page ${page}:`, error);
    appendLog(`Error fetching transactions for page ${page}: ${error}`);
    res.status(500).send("Error fetching transactions");
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
