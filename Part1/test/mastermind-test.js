//[assignment] write your own unit test to show that your Mastermind variation circuit is working as expected
const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { utils, BigNumber} = ethers;
const snarkjs = require("snarkjs");
const fs = require("fs");

const wasm_tester = require("circom_tester").wasm;

const F1Field = require("ffjavascript").F1Field;
const Scalar = require("ffjavascript").Scalar;
exports.p = Scalar.fromString("21888242871839275222246405745257275088548364400416034343698204186575808495617");
const Fr = new F1Field(exports.p);

const { buildPoseidon } = require('circomlibjs')

const poseidonHash = async (items) => {
    let poseidon = await buildPoseidon()
    return BigNumber.from(poseidon.F.toObject(poseidon(items)))
}

describe("Mastermind", function () {
    this.timeout(100000000);
    let circuit;

    before(async () => {
      // Load circuit
      circuit = await wasm_tester("contracts/circuits/MastermindVariation.circom");
    })

    it("should generates the witness properly", async function () {
      // Setup the input values
      const Solution = [1,2,3];
      const guess = [1,3,2];
      const numHit = 1;  // 1 is included in the solution and on the right position
      const numBlow = 2; // 2,3 are included in the solution but not on the same position
      const salt = BigNumber.from(utils.randomBytes(32));
      const solnHash = await poseidonHash([salt, Solution[0], Solution[1], Solution[2]]);
      // console.log("solnHash: ", solnHash);
      
      // Compose input 
      const input = {
              pubGuessA: guess[0],
              pubGuessB: guess[1],
              pubGuessC: guess[2],
              pubNumHit: numHit,
              pubNumBlow: numBlow,
              pubSolnHash: solnHash,
              privSolnA: Solution[0],
              privSolnB: Solution[1],
              privSolnC: Solution[2],
              privSalt: salt
          }

      // Calculate witness
      const witness = await circuit.calculateWitness(input, true);
      // console.log(witness);
      // Check witness is valid
      await circuit.checkConstraints(witness);
      assert(Fr.eq(Fr.e(witness[1]),Fr.e(solnHash)));
    });
});