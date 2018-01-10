/*
    This file is part of web3.js.

    web3.js is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    web3.js is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License
    along with web3.js.  If not, see <http://www.gnu.org/licenses/>.
*/
/**
 * @file web3.js
 * @authors:
 *   Jeffrey Wilcke <jeff@ethdev.com>
 *   Marek Kotewicz <marek@ethdev.com>
 *   Marian Oancea <marian@ethdev.com>
 *   Fabian Vogelsteller <fabian@ethdev.com>
 *   Gav Wood <g@ethdev.com>
 * @date 2014
 */

var RequestManager = require('./web3/requestmanager');
var Iban = require('./web3/iban');
var Eth = require('./web3/methods/eth');
var DB = require('./web3/methods/db');
var Shh = require('./web3/methods/shh');
var Net = require('./web3/methods/net');
var Personal = require('./web3/methods/personal');
var Swarm = require('./web3/methods/swarm');
var Settings = require('./web3/settings');
var version = require('./version.json');
var utils = require('./utils/utils');
var sha3 = require('./utils/sha3');
var extend = require('./web3/extend');
var Batch = require('./web3/batch');
var Property = require('./web3/property');
var HttpProvider = require('./web3/httpprovider');
var IpcProvider = require('./web3/ipcprovider');
var BigNumber = require('bignumber.js');
//var keythereum = require('keythereum');
var uuid = require('node-uuid');

function Web3(provider) {
    this._requestManager = new RequestManager(provider);
    this.currentProvider = provider;
    this.eth = new Eth(this);
    this.db = new DB(this);
    this.shh = new Shh(this);
    this.net = new Net(this);
    this.personal = new Personal(this);
    this.bzz = new Swarm(this);
    this.settings = new Settings();
    this.version = {
        api: version.version
    };
    this.providers = {
        HttpProvider: HttpProvider,
        IpcProvider: IpcProvider
    };
    this._extend = extend(this);
    this._extend({
        properties: properties()
    });
    this.accounts = [];
}

// expose providers on the class
Web3.providers = {
    HttpProvider: HttpProvider,
    IpcProvider: IpcProvider
};

Web3.prototype.setProvider = function(provider) {
    this._requestManager.setProvider(provider);
    this.currentProvider = provider;
};

Web3.prototype.reset = function(keepIsSyncing) {
    this._requestManager.reset(keepIsSyncing);
    this.settings = new Settings();
};

Web3.prototype.BigNumber = BigNumber;
Web3.prototype.toHex = utils.toHex;
Web3.prototype.toAscii = utils.toAscii;
Web3.prototype.toUtf8 = utils.toUtf8;
Web3.prototype.fromAscii = utils.fromAscii;
Web3.prototype.fromUtf8 = utils.fromUtf8;
Web3.prototype.toDecimal = utils.toDecimal;
Web3.prototype.fromDecimal = utils.fromDecimal;
Web3.prototype.toBigNumber = utils.toBigNumber;
Web3.prototype.toWei = utils.toWei;
Web3.prototype.fromWei = utils.fromWei;
Web3.prototype.isAddress = utils.isAddress;
Web3.prototype.isChecksumAddress = utils.isChecksumAddress;
Web3.prototype.toChecksumAddress = utils.toChecksumAddress;
Web3.prototype.isIBAN = utils.isIBAN;
Web3.prototype.padLeft = utils.padLeft;
Web3.prototype.padRight = utils.padRight;

Web3.prototype.sha3 = function(string, options) {
    return '0x' + sha3(string, options);
};

/**
 * Transforms direct icap to address
 */
Web3.prototype.fromICAP = function(icap) {
    var iban = new Iban(icap);
    return iban.address();
};

var properties = function() {
    return [
        new Property({
            name: 'version.node',
            getter: 'web3_clientVersion'
        }),
        new Property({
            name: 'version.network',
            getter: 'net_version',
            inputFormatter: utils.toDecimal
        }),
        new Property({
            name: 'version.ethereum',
            getter: 'eth_protocolVersion',
            inputFormatter: utils.toDecimal
        }),
        new Property({
            name: 'version.whisper',
            getter: 'shh_version',
            inputFormatter: utils.toDecimal
        })
    ];
};

Web3.prototype.isConnected = function() {
    return (this.currentProvider && this.currentProvider.isConnected());
};

Web3.prototype.createBatch = function() {
    return new Batch(this);
};

// Web3.prototype.addAccount = function(data) {
//     var ret = true;
//     if (typeof data == 'object') {
//         this.accounts.push(data);
//     } else if (typeof data == 'string') {
//         var account = {
//             address: undefined,
//             privateKey: data
//         }
//         account.address = keythereum.privateKeyToAddress(data);

//         this.accounts.push(account);
//     } else {
//         ret = false;
//     }

//     return ret;
// }

// Web3.prototype.clearAccount = function() {
//     this.accounts = [];
// }

// Web3.prototype.unlockAccount = function(address, password, callback) {
//     var key = this.accounts.find((account) => account.address == address);
//     if (key) {
//         keythereum.recover(password, key, function(privateKey) {
//             key.privateKey = privateKey.toString('hex');
//             callback(key.privateKey);
//         });
//     }
// }

Web3.prototype.nonce = function () {
    var nonce = Buffer.from(sha3(uuid()), 'hex');
    var timestamp = global.web3 ? parseInt(global.web3.eth.timeStamp()) : new Date().getTime();
    for (var i = 7; i >= 0; i--) {
        nonce[i] = timestamp % 256;
        timestamp /= 256;
    }
    return nonce;
};

module.exports = Web3;