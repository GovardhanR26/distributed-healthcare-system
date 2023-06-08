# D-Healthcare

D-Healthcare is a blockchain-based decentralized application for storing and sharing of EMR (Electronic Medical Records) of patients. It provides an end-to-end solution for a healthcare system while securely storing patient medical records, and giving patients control over their data.

## Prerequisites:

1. Truffle

   - _Truffle_ is a framework used for building blockchain based applications. It eases the process of writing and deploying smart contracts.
   - Truffle can be installed with NPM via the command line
     > `$ npm install -g truffle`
   - If NPM is not installed, it can installed using this link - https://nodejs.org/en/download/

2. Ganache

   - _Ganache_ is a tool, part of the Truffle suite, that creates a private Ethereum based blockchain on a local system and can be used for testing contracts and development purposes.
   - Ganache can be installed using NPM
     > `$ npm install ganache --global`
   - Alternatively, Ganache can be downloaded and installed from here - https://trufflesuite.com/ganache/

3. React

   - _ReactJS_ is a JavaScript library that is used for building user interfaces. It is one of the famous frontend frameworks for developing single page applications.
   - First, we need to install create-react-app
     > `npm install create-react-app`
   - This `create-react-app` can be used on the command line to create React projects

4. MetaMask
   - _Metamask_ is a browser extension that is used to manage crypto wallets and helps browsers connect to blockchain. It allows users to interact with decentralized applications.
   - This browser extension for Chrome can be downloaded from [here](https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en).

## Steps to run:

1. Clone this GitHub repository
2. Run Ganache and copy the addresses provided from ganache to `Health.sol`
3. Open terminal and run:
   > `truffle migrate --reset`
4. Copy the json files from `build/contracts` folder to `frontend/abis`
5. Open another terminal and run the following commands:
   > `cd frontend` <br> `npm i` <br> `npm start`
