import './configureAmplify';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';

const client = generateClient<Schema>();

// All makes from your Supabase database
const makes = [
  { makeId: 'abarth', makeName: 'Abarth', country: 'IT', isClassic: true },
  { makeId: 'ac', makeName: 'AC', country: 'UK', isClassic: true },
  { makeId: 'acura', makeName: 'Acura', country: 'JP', isClassic: false },
  { makeId: 'alfa_romeo', makeName: 'Alfa Romeo', country: 'IT', isClassic: true },
  { makeId: 'alpine', makeName: 'Alpine', country: 'FR', isClassic: true },
  { makeId: 'aston_martin', makeName: 'Aston Martin', country: 'UK', isClassic: true },
  { makeId: 'audi', makeName: 'Audi', country: 'DE', isClassic: true },
  { makeId: 'austin', makeName: 'Austin', country: 'UK', isClassic: true },
  { makeId: 'austin_healey', makeName: 'Austin-Healey', country: 'UK', isClassic: true },
  { makeId: 'bentley', makeName: 'Bentley', country: 'UK', isClassic: true },
  { makeId: 'bmw', makeName: 'BMW', country: 'DE', isClassic: true },
  { makeId: 'bugatti', makeName: 'Bugatti', country: 'FR', isClassic: true },
  { makeId: 'buick', makeName: 'Buick', country: 'US', isClassic: true },
  { makeId: 'byd', makeName: 'BYD', country: 'CN', isClassic: false, yearsFrom: 1995 },
  { makeId: 'cadillac', makeName: 'Cadillac', country: 'US', isClassic: true },
  { makeId: 'chevrolet', makeName: 'Chevrolet', country: 'US', isClassic: true },
  { makeId: 'chrysler', makeName: 'Chrysler', country: 'US', isClassic: true },
  { makeId: 'citroen', makeName: 'Citroën', country: 'FR', isClassic: true },
  { makeId: 'dacia', makeName: 'Dacia', country: 'RO', isClassic: false, yearsFrom: 1966 },
  { makeId: 'datsun', makeName: 'Datsun', country: 'JP', isClassic: true },
  { makeId: 'de_tomaso', makeName: 'De Tomaso', country: 'IT', isClassic: true },
  { makeId: 'dodge', makeName: 'Dodge', country: 'US', isClassic: true },
  { makeId: 'ferrari', makeName: 'Ferrari', country: 'IT', isClassic: true },
  { makeId: 'fiat', makeName: 'Fiat', country: 'IT', isClassic: true },
  { makeId: 'ford', makeName: 'Ford', country: 'US', isClassic: true },
  { makeId: 'genesis', makeName: 'Genesis', country: 'KR', isClassic: false, yearsFrom: 2015 },
  { makeId: 'geely', makeName: 'Geely', country: 'CN', isClassic: false, yearsFrom: 1986 },
  { makeId: 'honda', makeName: 'Honda', country: 'JP', isClassic: true },
  { makeId: 'hyundai', makeName: 'Hyundai', country: 'KR', isClassic: false, yearsFrom: 1967 },
  { makeId: 'infiniti', makeName: 'Infiniti', country: 'JP', isClassic: false, yearsFrom: 1989 },
  { makeId: 'jaguar', makeName: 'Jaguar', country: 'UK', isClassic: true },
  { makeId: 'kia', makeName: 'Kia', country: 'KR', isClassic: false, yearsFrom: 1944 },
  { makeId: 'koenigsegg', makeName: 'Koenigsegg', country: 'SE', isClassic: false, yearsFrom: 1994 },
  { makeId: 'lada', makeName: 'Lada', country: 'RU', isClassic: false, yearsFrom: 1966 },
  { makeId: 'lamborghini', makeName: 'Lamborghini', country: 'IT', isClassic: true },
  { makeId: 'lancia', makeName: 'Lancia', country: 'IT', isClassic: true },
  { makeId: 'land_rover', makeName: 'Land Rover', country: 'UK', isClassic: true },
  { makeId: 'lexus', makeName: 'Lexus', country: 'JP', isClassic: false, yearsFrom: 1989 },
  { makeId: 'lotus', makeName: 'Lotus', country: 'UK', isClassic: true },
  { makeId: 'mahindra', makeName: 'Mahindra', country: 'IN', isClassic: false, yearsFrom: 1945 },
  { makeId: 'maserati', makeName: 'Maserati', country: 'IT', isClassic: true },
  { makeId: 'mazda', makeName: 'Mazda', country: 'JP', isClassic: true },
  { makeId: 'mclaren', makeName: 'McLaren', country: 'UK', isClassic: true },
  { makeId: 'mercedes_benz', makeName: 'Mercedes-Benz', country: 'DE', isClassic: true },
  { makeId: 'mg', makeName: 'MG', country: 'UK', isClassic: true },
  { makeId: 'mini', makeName: 'Mini', country: 'UK', isClassic: true },
  { makeId: 'nio', makeName: 'NIO', country: 'CN', isClassic: false, yearsFrom: 2014 },
  { makeId: 'nissan', makeName: 'Nissan', country: 'JP', isClassic: true },
  { makeId: 'opel', makeName: 'Opel', country: 'DE', isClassic: true },
  { makeId: 'pagani', makeName: 'Pagani', country: 'IT', isClassic: false, yearsFrom: 1992 },
  { makeId: 'peugeot', makeName: 'Peugeot', country: 'FR', isClassic: true },
  { makeId: 'polestar', makeName: 'Polestar', country: 'SE', isClassic: false, yearsFrom: 1996 },
  { makeId: 'porsche', makeName: 'Porsche', country: 'DE', isClassic: true, yearsFrom: 1931 },
  { makeId: 'renault', makeName: 'Renault', country: 'FR', isClassic: true },
  { makeId: 'rolls_royce', makeName: 'Rolls-Royce', country: 'UK', isClassic: true },
  { makeId: 'saab', makeName: 'Saab', country: 'SE', isClassic: true },
  { makeId: 'seat', makeName: 'SEAT', country: 'ES', isClassic: false, yearsFrom: 1950 },
  { makeId: 'skoda', makeName: 'Škoda', country: 'CZ', isClassic: false, yearsFrom: 1895 },
  { makeId: 'ssangyong', makeName: 'SsangYong', country: 'KR', isClassic: false, yearsFrom: 1954 },
  { makeId: 'subaru', makeName: 'Subaru', country: 'JP', isClassic: true },
  { makeId: 'suzuki', makeName: 'Suzuki', country: 'JP', isClassic: false, yearsFrom: 1909 },
  { makeId: 'tata', makeName: 'Tata', country: 'IN', isClassic: false, yearsFrom: 1945 },
  { makeId: 'tatra', makeName: 'Tatra', country: 'CZ', isClassic: true, yearsFrom: 1897 },
  { makeId: 'tesla', makeName: 'Tesla', country: 'US', isClassic: false, yearsFrom: 2003 },
  { makeId: 'toyota', makeName: 'Toyota', country: 'JP', isClassic: true },
  { makeId: 'triumph', makeName: 'Triumph', country: 'UK', isClassic: true },
  { makeId: 'tvr', makeName: 'TVR', country: 'UK', isClassic: true },
  { makeId: 'volkswagen', makeName: 'Volkswagen', country: 'DE', isClassic: true },
  { makeId: 'volvo', makeName: 'Volvo', country: 'SE', isClassic: true },
  { makeId: 'xpeng', makeName: 'XPeng', country: 'CN', isClassic: false, yearsFrom: 2014 },
];

// All models from your Supabase database
const models = [
  // Porsche
  { modelId: 'porsche_356', makeId: 'porsche', modelName: '356', fullName: 'Porsche 356', yearsFrom: 1948, yearsTo: 1965 },
  { modelId: 'porsche_911', makeId: 'porsche', modelName: '911', fullName: 'Porsche 911', yearsFrom: 1964 },
  { modelId: 'porsche_911_carrera', makeId: 'porsche', modelName: '911 Carrera', fullName: 'Porsche 911 Carrera', yearsFrom: 1964 },
  { modelId: 'porsche_911_turbo', makeId: 'porsche', modelName: '911 Turbo', fullName: 'Porsche 911 Turbo', yearsFrom: 1975 },
  { modelId: 'porsche_911_gt3', makeId: 'porsche', modelName: '911 GT3', fullName: 'Porsche 911 GT3', yearsFrom: 1999 },
  { modelId: 'porsche_911_gt2', makeId: 'porsche', modelName: '911 GT2', fullName: 'Porsche 911 GT2', yearsFrom: 1993 },
  { modelId: 'porsche_911_targa', makeId: 'porsche', modelName: '911 Targa', fullName: 'Porsche 911 Targa', yearsFrom: 1967 },
  { modelId: 'porsche_912', makeId: 'porsche', modelName: '912', fullName: 'Porsche 912', yearsFrom: 1965, yearsTo: 1969 },
  { modelId: 'porsche_914', makeId: 'porsche', modelName: '914', fullName: 'Porsche 914', yearsFrom: 1969, yearsTo: 1976 },
  { modelId: 'porsche_924', makeId: 'porsche', modelName: '924', fullName: 'Porsche 924', yearsFrom: 1976, yearsTo: 1988 },
  { modelId: 'porsche_928', makeId: 'porsche', modelName: '928', fullName: 'Porsche 928', yearsFrom: 1977, yearsTo: 1995 },
  { modelId: 'porsche_944', makeId: 'porsche', modelName: '944', fullName: 'Porsche 944', yearsFrom: 1982, yearsTo: 1991 },
  { modelId: 'porsche_959', makeId: 'porsche', modelName: '959', fullName: 'Porsche 959', yearsFrom: 1986, yearsTo: 1993 },
  { modelId: 'porsche_968', makeId: 'porsche', modelName: '968', fullName: 'Porsche 968', yearsFrom: 1991, yearsTo: 1995 },
  { modelId: 'porsche_boxster', makeId: 'porsche', modelName: 'Boxster', fullName: 'Porsche Boxster', yearsFrom: 1996 },
  { modelId: 'porsche_cayman', makeId: 'porsche', modelName: 'Cayman', fullName: 'Porsche Cayman', yearsFrom: 2005 },
  { modelId: 'porsche_cayenne', makeId: 'porsche', modelName: 'Cayenne', fullName: 'Porsche Cayenne', yearsFrom: 2002 },
  { modelId: 'porsche_macan', makeId: 'porsche', modelName: 'Macan', fullName: 'Porsche Macan', yearsFrom: 2014 },
  { modelId: 'porsche_panamera', makeId: 'porsche', modelName: 'Panamera', fullName: 'Porsche Panamera', yearsFrom: 2009 },
  { modelId: 'porsche_taycan', makeId: 'porsche', modelName: 'Taycan', fullName: 'Porsche Taycan', yearsFrom: 2019 },
  { modelId: 'porsche_carrera_gt', makeId: 'porsche', modelName: 'Carrera GT', fullName: 'Porsche Carrera GT', yearsFrom: 2004, yearsTo: 2007 },
  { modelId: 'porsche_918', makeId: 'porsche', modelName: '918 Spyder', fullName: 'Porsche 918 Spyder', yearsFrom: 2013, yearsTo: 2015 },

  // Ferrari
  { modelId: 'ferrari_250', makeId: 'ferrari', modelName: '250', fullName: 'Ferrari 250', yearsFrom: 1953, yearsTo: 1964 },
  { modelId: 'ferrari_275', makeId: 'ferrari', modelName: '275', fullName: 'Ferrari 275', yearsFrom: 1964, yearsTo: 1968 },
  { modelId: 'ferrari_288gto', makeId: 'ferrari', modelName: '288 GTO', fullName: 'Ferrari 288 GTO', yearsFrom: 1984, yearsTo: 1987 },
  { modelId: 'ferrari_308', makeId: 'ferrari', modelName: '308', fullName: 'Ferrari 308', yearsFrom: 1975, yearsTo: 1985 },
  { modelId: 'ferrari_328', makeId: 'ferrari', modelName: '328', fullName: 'Ferrari 328', yearsFrom: 1985, yearsTo: 1989 },
  { modelId: 'ferrari_348', makeId: 'ferrari', modelName: '348', fullName: 'Ferrari 348', yearsFrom: 1989, yearsTo: 1995 },
  { modelId: 'ferrari_355', makeId: 'ferrari', modelName: 'F355', fullName: 'Ferrari F355', yearsFrom: 1994, yearsTo: 1999 },
  { modelId: 'ferrari_360', makeId: 'ferrari', modelName: '360', fullName: 'Ferrari 360', yearsFrom: 1999, yearsTo: 2005 },
  { modelId: 'ferrari_430', makeId: 'ferrari', modelName: 'F430', fullName: 'Ferrari F430', yearsFrom: 2004, yearsTo: 2009 },
  { modelId: 'ferrari_458', makeId: 'ferrari', modelName: '458', fullName: 'Ferrari 458', yearsFrom: 2009, yearsTo: 2015 },
  { modelId: 'ferrari_488', makeId: 'ferrari', modelName: '488', fullName: 'Ferrari 488', yearsFrom: 2015, yearsTo: 2019 },
  { modelId: 'ferrari_f8', makeId: 'ferrari', modelName: 'F8', fullName: 'Ferrari F8', yearsFrom: 2019 },
  { modelId: 'ferrari_testarossa', makeId: 'ferrari', modelName: 'Testarossa', fullName: 'Ferrari Testarossa', yearsFrom: 1984, yearsTo: 1991 },
  { modelId: 'ferrari_f40', makeId: 'ferrari', modelName: 'F40', fullName: 'Ferrari F40', yearsFrom: 1987, yearsTo: 1992 },
  { modelId: 'ferrari_f50', makeId: 'ferrari', modelName: 'F50', fullName: 'Ferrari F50', yearsFrom: 1995, yearsTo: 1997 },
  { modelId: 'ferrari_enzo', makeId: 'ferrari', modelName: 'Enzo', fullName: 'Ferrari Enzo', yearsFrom: 2002, yearsTo: 2004 },
  { modelId: 'ferrari_laferrari', makeId: 'ferrari', modelName: 'LaFerrari', fullName: 'Ferrari LaFerrari', yearsFrom: 2013, yearsTo: 2018 },
  { modelId: 'ferrari_sf90', makeId: 'ferrari', modelName: 'SF90', fullName: 'Ferrari SF90 Stradale', yearsFrom: 2019 },
  { modelId: 'ferrari_812', makeId: 'ferrari', modelName: '812', fullName: 'Ferrari 812 Superfast', yearsFrom: 2017 },
  { modelId: 'ferrari_roma', makeId: 'ferrari', modelName: 'Roma', fullName: 'Ferrari Roma', yearsFrom: 2020 },
  { modelId: 'ferrari_portofino', makeId: 'ferrari', modelName: 'Portofino', fullName: 'Ferrari Portofino', yearsFrom: 2017 },
  { modelId: 'ferrari_california', makeId: 'ferrari', modelName: 'California', fullName: 'Ferrari California', yearsFrom: 2008, yearsTo: 2017 },
  { modelId: 'ferrari_daytona', makeId: 'ferrari', modelName: 'Daytona', fullName: 'Ferrari 365 GTB/4 Daytona', yearsFrom: 1968, yearsTo: 1973 },
  { modelId: 'ferrari_dino', makeId: 'ferrari', modelName: 'Dino', fullName: 'Ferrari Dino 246', yearsFrom: 1969, yearsTo: 1974 },

  // Lamborghini
  { modelId: 'lamborghini_miura', makeId: 'lamborghini', modelName: 'Miura', fullName: 'Lamborghini Miura', yearsFrom: 1966, yearsTo: 1973 },
  { modelId: 'lamborghini_countach', makeId: 'lamborghini', modelName: 'Countach', fullName: 'Lamborghini Countach', yearsFrom: 1974, yearsTo: 1990 },
  { modelId: 'lamborghini_diablo', makeId: 'lamborghini', modelName: 'Diablo', fullName: 'Lamborghini Diablo', yearsFrom: 1990, yearsTo: 2001 },
  { modelId: 'lamborghini_murcielago', makeId: 'lamborghini', modelName: 'Murciélago', fullName: 'Lamborghini Murciélago', yearsFrom: 2001, yearsTo: 2010 },
  { modelId: 'lamborghini_aventador', makeId: 'lamborghini', modelName: 'Aventador', fullName: 'Lamborghini Aventador', yearsFrom: 2011, yearsTo: 2022 },
  { modelId: 'lamborghini_huracan', makeId: 'lamborghini', modelName: 'Huracán', fullName: 'Lamborghini Huracán', yearsFrom: 2014 },
  { modelId: 'lamborghini_urus', makeId: 'lamborghini', modelName: 'Urus', fullName: 'Lamborghini Urus', yearsFrom: 2018 },
  { modelId: 'lamborghini_revuelto', makeId: 'lamborghini', modelName: 'Revuelto', fullName: 'Lamborghini Revuelto', yearsFrom: 2023 },

  // BMW
  { modelId: 'bmw_2002', makeId: 'bmw', modelName: '2002', fullName: 'BMW 2002', yearsFrom: 1968, yearsTo: 1976 },
  { modelId: 'bmw_e9', makeId: 'bmw', modelName: 'E9', fullName: 'BMW E9 (3.0 CS/CSi/CSL)', yearsFrom: 1968, yearsTo: 1975 },
  { modelId: 'bmw_e24', makeId: 'bmw', modelName: 'E24', fullName: 'BMW E24 6 Series', yearsFrom: 1976, yearsTo: 1989 },
  { modelId: 'bmw_e28', makeId: 'bmw', modelName: 'E28', fullName: 'BMW E28 5 Series', yearsFrom: 1981, yearsTo: 1988 },
  { modelId: 'bmw_e30', makeId: 'bmw', modelName: 'E30', fullName: 'BMW E30 3 Series', yearsFrom: 1982, yearsTo: 1994 },
  { modelId: 'bmw_m3', makeId: 'bmw', modelName: 'M3', fullName: 'BMW M3', yearsFrom: 1986 },
  { modelId: 'bmw_m5', makeId: 'bmw', modelName: 'M5', fullName: 'BMW M5', yearsFrom: 1984 },
  { modelId: 'bmw_z8', makeId: 'bmw', modelName: 'Z8', fullName: 'BMW Z8', yearsFrom: 2000, yearsTo: 2003 },

  // Mercedes-Benz
  { modelId: 'mercedes_benz_w113', makeId: 'mercedes_benz', modelName: 'W113 Pagoda', fullName: 'Mercedes-Benz W113 Pagoda', yearsFrom: 1963, yearsTo: 1971 },
  { modelId: 'mercedes_benz_w198', makeId: 'mercedes_benz', modelName: '300 SL', fullName: 'Mercedes-Benz 300 SL', yearsFrom: 1954, yearsTo: 1963 },
  { modelId: 'mercedes_benz_w124', makeId: 'mercedes_benz', modelName: 'W124', fullName: 'Mercedes-Benz W124 E-Class', yearsFrom: 1984, yearsTo: 1997 },
  { modelId: 'mercedes_benz_amg_gt', makeId: 'mercedes_benz', modelName: 'AMG GT', fullName: 'Mercedes-AMG GT', yearsFrom: 2014 },
  { modelId: 'mercedes_benz_sls', makeId: 'mercedes_benz', modelName: 'SLS AMG', fullName: 'Mercedes-Benz SLS AMG', yearsFrom: 2010, yearsTo: 2015 },

  // Jaguar
  { modelId: 'jaguar_etype', makeId: 'jaguar', modelName: 'E-Type', fullName: 'Jaguar E-Type', yearsFrom: 1961, yearsTo: 1975 },
  { modelId: 'jaguar_xj220', makeId: 'jaguar', modelName: 'XJ220', fullName: 'Jaguar XJ220', yearsFrom: 1992, yearsTo: 1994 },
  { modelId: 'jaguar_ftype', makeId: 'jaguar', modelName: 'F-Type', fullName: 'Jaguar F-Type', yearsFrom: 2013 },

  // Alfa Romeo
  { modelId: 'alfa_romeo_giulia', makeId: 'alfa_romeo', modelName: 'Giulia', fullName: 'Alfa Romeo Giulia', yearsFrom: 1962 },
  { modelId: 'alfa_romeo_spider', makeId: 'alfa_romeo', modelName: 'Spider', fullName: 'Alfa Romeo Spider', yearsFrom: 1966, yearsTo: 1993 },
  { modelId: 'alfa_romeo_gtv', makeId: 'alfa_romeo', modelName: 'GTV', fullName: 'Alfa Romeo GTV', yearsFrom: 1995, yearsTo: 2006 },
  { modelId: 'alfa_romeo_4c', makeId: 'alfa_romeo', modelName: '4C', fullName: 'Alfa Romeo 4C', yearsFrom: 2013, yearsTo: 2020 },

  // Aston Martin
  { modelId: 'aston_martin_db5', makeId: 'aston_martin', modelName: 'DB5', fullName: 'Aston Martin DB5', yearsFrom: 1963, yearsTo: 1965 },
  { modelId: 'aston_martin_db9', makeId: 'aston_martin', modelName: 'DB9', fullName: 'Aston Martin DB9', yearsFrom: 2004, yearsTo: 2016 },
  { modelId: 'aston_martin_db11', makeId: 'aston_martin', modelName: 'DB11', fullName: 'Aston Martin DB11', yearsFrom: 2016 },
  { modelId: 'aston_martin_vantage', makeId: 'aston_martin', modelName: 'Vantage', fullName: 'Aston Martin Vantage', yearsFrom: 2005 },

  // McLaren
  { modelId: 'mclaren_f1', makeId: 'mclaren', modelName: 'F1', fullName: 'McLaren F1', yearsFrom: 1992, yearsTo: 1998 },
  { modelId: 'mclaren_p1', makeId: 'mclaren', modelName: 'P1', fullName: 'McLaren P1', yearsFrom: 2013, yearsTo: 2015 },
  { modelId: 'mclaren_720s', makeId: 'mclaren', modelName: '720S', fullName: 'McLaren 720S', yearsFrom: 2017 },
  { modelId: 'mclaren_570s', makeId: 'mclaren', modelName: '570S', fullName: 'McLaren 570S', yearsFrom: 2015, yearsTo: 2021 },

  // Lotus
  { modelId: 'lotus_esprit', makeId: 'lotus', modelName: 'Esprit', fullName: 'Lotus Esprit', yearsFrom: 1976, yearsTo: 2004 },
  { modelId: 'lotus_elise', makeId: 'lotus', modelName: 'Elise', fullName: 'Lotus Elise', yearsFrom: 1996, yearsTo: 2021 },
  { modelId: 'lotus_exige', makeId: 'lotus', modelName: 'Exige', fullName: 'Lotus Exige', yearsFrom: 2000 },
  { modelId: 'lotus_evora', makeId: 'lotus', modelName: 'Evora', fullName: 'Lotus Evora', yearsFrom: 2009 },

  // Maserati
  { modelId: 'maserati_ghibli', makeId: 'maserati', modelName: 'Ghibli', fullName: 'Maserati Ghibli', yearsFrom: 1967 },
  { modelId: 'maserati_quattroporte', makeId: 'maserati', modelName: 'Quattroporte', fullName: 'Maserati Quattroporte', yearsFrom: 1963 },
  { modelId: 'maserati_granturismo', makeId: 'maserati', modelName: 'GranTurismo', fullName: 'Maserati GranTurismo', yearsFrom: 2007 },
  { modelId: 'maserati_mc20', makeId: 'maserati', modelName: 'MC20', fullName: 'Maserati MC20', yearsFrom: 2020 },

  // Tesla
  { modelId: 'tesla_roadster', makeId: 'tesla', modelName: 'Roadster', fullName: 'Tesla Roadster', yearsFrom: 2008, yearsTo: 2012 },
  { modelId: 'tesla_model_s', makeId: 'tesla', modelName: 'Model S', fullName: 'Tesla Model S', yearsFrom: 2012 },
  { modelId: 'tesla_model_3', makeId: 'tesla', modelName: 'Model 3', fullName: 'Tesla Model 3', yearsFrom: 2017 },
  { modelId: 'tesla_model_x', makeId: 'tesla', modelName: 'Model X', fullName: 'Tesla Model X', yearsFrom: 2015 },
  { modelId: 'tesla_model_y', makeId: 'tesla', modelName: 'Model Y', fullName: 'Tesla Model Y', yearsFrom: 2020 },
];

export async function importAllData(
  onProgress: (message: string) => void
): Promise<{ makesImported: number; modelsImported: number; errors: string[] }> {
  const errors: string[] = [];
  let makesImported = 0;
  let modelsImported = 0;

  // Import makes first
  onProgress('Importing car makes...');
  for (const make of makes) {
    try {
      await client.models.Make.create(make);
      makesImported++;
      onProgress(`Added: ${make.makeName}`);
    } catch (error: any) {
      // Skip if already exists
      if (!error.message?.includes('already exists')) {
        errors.push(`Make ${make.makeName}: ${error.message}`);
      }
    }
  }

  onProgress(`\nImported ${makesImported} makes. Now importing models...`);

  // Import models
  for (const model of models) {
    try {
      await client.models.Model.create(model);
      modelsImported++;
      onProgress(`Added: ${model.fullName}`);
    } catch (error: any) {
      if (!error.message?.includes('already exists')) {
        errors.push(`Model ${model.fullName}: ${error.message}`);
      }
    }
  }

  onProgress(`\n✅ Import complete! ${makesImported} makes, ${modelsImported} models`);

  return { makesImported, modelsImported, errors };
}
