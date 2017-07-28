import { makeExecutableSchema } from "graphql-tools";
import { GraphQLScalarType } from "graphql";
import { Kind } from "graphql/language";

import moment from "moment";

import _ from "lodash";

import db from "./db";

const typeDefs = `
  scalar Date

  enum AlcoholUnit {
    MILLILITER
    # Danish standard unit of alcohol
    GENSTAND
    GRAM
  }

  type Metadata {
    name: String!
    value: String!
  }
  type Purchase {
    id: String!
    products: [Product]
    purchasedAt: Date
    purchasedDuring: Camp
    totalAlcohol(unit: AlcoholUnit = MILLILITER): Float
  }
  type Product {
    id: String
    name: String
    variantName: String
    quantity: Int
    # Product metadata
    metadata: [Metadata]
  }
  type Camp {
    id: String
    name: String
    startDate: Date
    endDate: Date
    purchases: [Purchase]
  }
  type Query {
    getPurchases: [Purchase]
    getCamps: [Camp]
  }
`;

const camps = [
  {
    id: "bornhack-2016",
    name: "Bornhack 2016",
    startDate: new Date("2016-08-27"),
    endDate: moment(new Date("2016-09-03")).endOf("day").toDate(),
  },
  {
    id: "bornhack-2017",
    name: "Bornhack 2017",
    startDate: new Date("2017-08-22"),
    endDate: moment("2017-08-29").endOf("day").toDate(),
  },
];

const productReducer = (productName = "", variantName = "") => {
  const metadata = {};

  switch (productName) {
    case "Beer":
      metadata.volume = 500;
      switch (variantName) {
        case "Bornholmerøl - Opalsøen":
          metadata.abv = 0.05;
          break;
        case "Bornholmerøl - Lyseklippen":
          metadata.abv = 0.049;
          break;
        case "Bornholmerøl - Jylkattinj":
          metadata.abv = 0.068;
          break;
        case "Bornholmerøl - Rokkestenen":
          metadata.abv = 0.045;
          break;
        case "Bornholmerøl - Sommer Pajan":
          metadata.abv = 0.045;
          break;
        case "Svaneke - American Pale Ale":
          metadata.abv = 0.048;
          break;
        case "Svaneke - Blonde":
          metadata.abv = 0.046;
          break;
        case "Svaneke - Brown Ale":
          metadata.abv = 0.05;
          break;
        case "Svaneke - Classic":
          metadata.abv = 0.046;
          break;
        case "Svaneke - Green Mountain IPA":
          metadata.abv = 0.065;
          break;
        case "Svaneke - Green Copper":
        case "Svaneke - Greencopper":
          metadata.abv = 0.048;
          break;
        case "Svaneke - Green Keeper":
        case "Svaneke - Greenkeeper":
          metadata.abv = 0.048;
          break;
        case "Svaneke - Mørk Guld":
          metadata.abv = 0.056;
          break;
        case "Svaneke - Stærke Preben":
          metadata.abv = 0.079;
          break;
        case "Svaneke - Pilsner":
          metadata.abv = 0.046;
          break;
        case "Svaneke - Stout":
          metadata.abv = 0.057;
          break;
        case "Svaneke - Sweet Mary":
          metadata.abv = 0.079;
          break;
      }
      if (!metadata.abv) {
        console.log(productName, variantName);
      }
      break;
    case "Club Mate":
      metadata.volume = 500;
      break;
    case "Cocio":
      switch (variantName) {
        case "0,4L":
          metadata.volume = 400;
          break;
      }
      break;
    case "Soda":
      switch (variantName) {
        case "0,5L Faxe Kondi":
        case "Faxe Kondi":
        case "0.5L Coca Cola":
        case "Coca Cola":
          metadata.volume = 500;
          break;
      }
      if (variantName.substr(-6) === " - Thy") {
        metadata.volume = 250;
      }
      break;
    case "Vodka":
      switch (variantName) {
        case "Watka":
          metadata.volume = 500;
          break;
      }
      break;
    case "Dram":
    case "Shot":
    case "Shot Rum":
      metadata.volume = 20;
      metadata.abv = 0.4;
      switch (variantName) {
        case "Bornholmer Bitter":
          metadata.abv = 0.38;
          break;
      }
      break;
    case "Bottle":
      switch (variantName) {
        case "Gajol Blå":
          metadata.abv = 0.3;
          metadata.volume = 700;
          break;
      }
      break;
    case "Cider":
      switch (variantName) {
        case "Somersby - Blackberry":
          metadata.abv = 0.045;
          metadata.volume = 500;
          break;
      }
      break;
    case "Wine":
      switch (variantName) {
        case "Red - Glass ":
        case "Red - Glass":
          metadata.abv = 0.12;
          metadata.volume = 150;
          break;
        case "Red - Bottle":
          metadata.abv = 0.12;
          metadata.volume = 700;
          break;
      }
      break;
  }
  /*
  if (
    !_.keys(metadata).length &&
    productName &&
    productName !== "25" &&
    productName !== "Cocktail" &&
    productName !== "Water" &&
    productName !== "Bottled Water" &&
    productName !== "Popcorn"
  ) {
    console.log(productName, variantName);
  }
  */
  return metadata;
};

const resolvers = {
  Date: new GraphQLScalarType({
    name: "Date",
    description: "Date custom scalar type",
    parseValue(value) {
      return new Date(value); // value from the client
    },
    serialize(value) {
      return value.getTime(); // value sent to the client
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.INT) {
        return parseInt(ast.value, 10); // ast value is always in string format
      }
      return null;
    },
  }),
  Query: {
    getPurchases: () => db.bar_purchases.find(),//.skip(Math.random()*1000),
    getCamps: () => camps,
  },
  Purchase: {
    id: ({ purchaseUUID1 }) => purchaseUUID1,
    purchasedAt: ({ timestamp }) => new Date(timestamp),
    totalAlcohol: ({ products }, { unit }) => {
      const totalAlcoholInML = products.reduce((total, { name, variantName, quantity }) => {
        const { abv=0, volume=0 } = productReducer(name, variantName);

        const alcohol = quantity * abv * volume;
        return total + alcohol;
      }, 0);

      switch (unit) {
        case 'MILLILITER':
          return totalAlcoholInML;
        break;
        case 'GENSTAND':
          return totalAlcoholInML/15;
        break;
      }
    },
    purchasedDuring: ({ timestamp }) =>
      camps.find(({ startDate, endDate }) =>
        moment(timestamp).isBetween(startDate, endDate),
      ),
  },
  Camp: {
    purchases: ({ startDate, endDate }) =>
      db.bar_purchases.find({
        timestamp: {
          $gte: +startDate,
          $lt: +endDate,
        },
      })//.skip(Math.random()*1000),
  },
  Product: {
    id: product=>JSON.stringify(product),
    metadata: ({ name, variantName }) => _.toPairs(productReducer(name, variantName)).map(([name, value]) => ({ name, value })),
  },
};

export default makeExecutableSchema({
  typeDefs,
  resolvers,
});
