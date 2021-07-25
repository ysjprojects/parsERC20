
import { Request, Response, NextFunction} from 'express';
import { query, validationResult, oneOf} from 'express-validator'
require('dotenv').config()

const express = require('express');
const router = express.Router();
const { requiresAuth } = require('express-openid-connect')

const APIERC = require("../api-erc.ts")
const APIBSC = require("../api-bsc.ts")

const getERC20TokensOfAddress = async (request: Request, response: Response, next: NextFunction) => {
  try {

    validationResult(request).throw()
    let address = request.params.address
    let query = request.query 
    let detailed = query.detailed ? JSON.parse(query.detailed.toString()) : false
    let metadata = query.metadata  ? JSON.parse(query.metadata.toString()) : false
    let startblock = query.startblock ? query.startblock : 0
    let tokens = query.tokens ? query.tokens : []
    let result = await APIERC.getTokensERC20({
      "address":address, 
      "detailed":detailed, 
      "metadata":metadata, 
      "startblock":startblock, 
      "existingERC20Tokens":tokens})
                            
                      
    response.status(200).json({"result":result, "query":{"address": address,"detailed":detailed,"metadata":metadata,"startblock":startblock,"existingERC20Tokens":tokens}})
                          
  } catch(e) {
    response.status(400).json({"error":e})
  }
}

const getERC20TokensOfAddresses = async (request:Request, response: Response, NextFunction:NextFunction) => {
  try {

    validationResult(request).throw()
    const maxNumAddresses = 20
    let query = request.query
    let addresses = query.addresses.toString().split(";")
    if (addresses.length > maxNumAddresses) {
      throw {name:"AddressesMaxLengthError",message:`max ${maxNumAddresses} addresses allowed in query`}
    }
    let detailed = query.detailed ? JSON.parse(query.detailed.toString()) : false
    let metadata = query.metadata  ? JSON.parse(query.metadata.toString()) : false
    let results = []
    
    const getAddressData = async (a) => {
      let res = await APIERC.getTokensERC20(
        {
          "address":a, 
          "detailed":detailed, 
          "metadata":metadata
        }
      )
      results.push({"address": a, "result": res})
    }

    let result = await Promise.all(addresses.map(a => {
      return getAddressData(a)
    }))
                            
                      
    response.status(200).json({"result":results,  "query":{"addresses":addresses,"detailed":detailed,"metadata":metadata}})
                          
  } catch(e) {
    response.status(400).json({"error":e})
  }
}

const getBEP20TokensOfAddress = async (request: Request, response: Response, next: NextFunction) => {
  try {

    validationResult(request).throw()
    let address = request.params.address
    let query = request.query 
    let detailed = query.detailed ? JSON.parse(query.detailed.toString()) : false
    let metadata = query.metadata  ? JSON.parse(query.metadata.toString()) : false
    let startblock = query.startblock ? query.startblock : 0
    let tokens = query.tokens ? query.tokens : []
    let result = await APIBSC.getTokensBEP20({
      "address":address, 
      "detailed":detailed, 
      "metadata":metadata, 
      "startblock":startblock, 
      "existingERC20Tokens":tokens})
                            
                      
    response.status(200).json({"result":result, "query":{"address": address,"detailed":detailed,"metadata":metadata,"startblock":startblock,"existingERC20Tokens":tokens}})
                          
  } catch(e) {
    response.status(400).json({"error":e})
  }
}

const getBEP20TokensOfAddresses = async (request:Request, response: Response, NextFunction:NextFunction) => {
  try {

    validationResult(request).throw()
    const maxNumAddresses = 20
    let query = request.query
    let addresses = query.addresses.toString().split(";")
    if (addresses.length > maxNumAddresses) {
      throw {name:"AddressesMaxLengthError",message:`max ${maxNumAddresses} addresses allowed in query`}
    }
    let detailed = query.detailed ? JSON.parse(query.detailed.toString()) : false
    let metadata = query.metadata  ? JSON.parse(query.metadata.toString()) : false
    let results = []
    
    const getAddressData = async (a) => {
      let res = await APIBSC.getTokensBEP20(
        {
          "address":a, 
          "detailed":detailed, 
          "metadata":metadata
        }
      )
      results.push({"address": a, "result": res})
    }

    let result = await Promise.all(addresses.map(a => {
      return getAddressData(a)
    }))
                            
                      
    response.status(200).json({"result":results,  "query":{"addresses":addresses,"detailed":detailed,"metadata":metadata}})
                          
  } catch(e) {
    response.status(400).json({"error": e })
  }
}

router.get('/', function (req, res, next) {
    res.render('index')
});

router.get("/api/erc/:address", [
  query('tokens').isArray().optional({nullable: true}).withMessage("List of tokens only"),
  query('startblock').if(query('tokens').exists()).notEmpty().isInt().withMessage("Integers only"), 
  query('detailed').isBoolean().optional({nullable: true}).withMessage("Booleans only"),
  query('metadata').isBoolean().optional({nullable: true}).withMessage("Booleans only"),
  query('secret').optional({nullable: true}).equals(process.env.API_ADMIN_KEY).withMessage("incorrect secret")
]
  ,getERC20TokensOfAddress
  )

router.get("/api/multi/erc", [
  query('addresses').exists().isString().withMessage("List of account addresses only"),
  query('detailed').isBoolean().optional({nullable: true}).withMessage("Booleans only"),
  query('metadata').isBoolean().optional({nullable: true}).withMessage("Booleans only"),
  query('secret').exists().equals(process.env.API_ADMIN_KEY).withMessage("Secret required for privileged route")
]
  ,getERC20TokensOfAddresses
  )

router.get("/api/bsc/:address", [
    query('tokens').isArray().optional({nullable: true}).withMessage("List of tokens only"),
    query('startblock').if(query('tokens').exists()).notEmpty().isInt().withMessage("Integers only"), 
    query('detailed').isBoolean().optional({nullable: true}).withMessage("Booleans only"),
    query('metadata').isBoolean().optional({nullable: true}).withMessage("Booleans only"),
    query('secret').equals(process.env.API_ADMIN_KEY).optional({nullable: true}).withMessage("incorrect secret")
  ]
    ,getBEP20TokensOfAddress
    )
  
router.get("/api/multi/bsc", [
    query('addresses').exists().isString().withMessage("List of account addresses only"),
    query('detailed').isBoolean().optional({nullable: true}).withMessage("Booleans only"),
    query('metadata').isBoolean().optional({nullable: true}).withMessage("Booleans only"),
    query('secret').exists().equals(process.env.API_ADMIN_KEY).withMessage("Secret required for privileged route")
  
  ]
    ,getBEP20TokensOfAddresses
    )


module.exports = router;

