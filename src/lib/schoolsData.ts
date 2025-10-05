// Real school data from uploaded Excel file
export interface RealSchool {
  id: string;
  division: string;
  district: string;
  tehsil: string;
  schoolName: string;
  ownerName: string;
  ownerMobile: string;
  schoolAddress: string;
  totalStudentsClass10: number;
  primaryMale: number;
  primaryFemale: number;
  totalPrimaryTeachers: number;
  grandTotal: number;
  status: string;
  cluster: string;
}

export const realSchools: RealSchool[] = [
  {
    id: 'rs1',
    division: 'FAISALABAD',
    district: 'JHANG',
    tehsil: 'AHMADPUR SIAL',
    schoolName: 'CHENAB GIRLS HIGH SCHOOL A.P.SIAL',
    ownerName: 'Samina Safdar',
    ownerMobile: '3356767156',
    schoolAddress: 'NEAR NAJAF PULL ALI TOWN AHMAD PUR SIAL',
    totalStudentsClass10: 112,
    primaryMale: 2,
    primaryFemale: 14,
    totalPrimaryTeachers: 16,
    grandTotal: 128,
    status: 'Recommended',
    cluster: 'Above 100'
  },
  {
    id: 'rs2',
    division: 'FAISALABAD',
    district: 'JHANG',
    tehsil: 'AHMADPUR SIAL',
    schoolName: 'IQRA PUBLIC GIRLS MIDDLE SCHOOL',
    ownerName: 'JAVED AKHTAR',
    ownerMobile: '3027226284',
    schoolAddress: 'MOZA MEERNAYWALA P/O MUD RAJBANA',
    totalStudentsClass10: 88,
    primaryMale: 0,
    primaryFemale: 11,
    totalPrimaryTeachers: 11,
    grandTotal: 99,
    status: 'Recommended',
    cluster: 'Above 50'
  },
  {
    id: 'rs3',
    division: 'FAISALABAD',
    district: 'JHANG',
    tehsil: '18 HAZARI',
    schoolName: 'Misali Sir Syed Girls High School',
    ownerName: 'MUHAMMAD UMAR AMJAD',
    ownerMobile: '3074848588',
    schoolAddress: 'UCH GUL IMAM ROAD MAYO CHOCK RODU SULTAN',
    totalStudentsClass10: 91,
    primaryMale: 0,
    primaryFemale: 7,
    totalPrimaryTeachers: 7,
    grandTotal: 98,
    status: 'Recommended',
    cluster: 'Above 50'
  },
  {
    id: 'rs4',
    division: 'FAISALABAD',
    district: 'JHANG',
    tehsil: '18 HAZARI',
    schoolName: 'OXFORD MODEL E/S',
    ownerName: 'Kaneez Fatima',
    ownerMobile: '3457606313',
    schoolAddress: 'P.O 18 HAZARI LAYYAH ROAD 18 HAZARI',
    totalStudentsClass10: 102,
    primaryMale: 4,
    primaryFemale: 5,
    totalPrimaryTeachers: 9,
    grandTotal: 111,
    status: 'Recommended',
    cluster: 'Above 100'
  },
  {
    id: 'rs5',
    division: 'FAISALABAD',
    district: 'JHANG',
    tehsil: 'AHMADPUR SIAL',
    schoolName: 'Al-Rehman Public (Girls) Elementary School',
    ownerName: 'Sarfraz Khan',
    ownerMobile: '3016061709',
    schoolAddress: 'Mouza Islam Wala P/O Nekokara Ada Pull Gagan',
    totalStudentsClass10: 100,
    primaryMale: 2,
    primaryFemale: 14,
    totalPrimaryTeachers: 16,
    grandTotal: 116,
    status: 'Recommended',
    cluster: 'Above 50'
  },
  {
    id: 'rs6',
    division: 'FAISALABAD',
    district: 'JHANG',
    tehsil: 'AHMADPUR SIAL',
    schoolName: 'SHABIR BILAL MODEL HIHGH SCHOOL',
    ownerName: 'Samina Munir',
    ownerMobile: '3023788685',
    schoolAddress: 'KOT BAHADAR SHAH',
    totalStudentsClass10: 119,
    primaryMale: 11,
    primaryFemale: 4,
    totalPrimaryTeachers: 15,
    grandTotal: 134,
    status: 'Recommended',
    cluster: 'Above 100'
  },
  {
    id: 'rs7',
    division: 'FAISALABAD',
    district: 'CHINIOT',
    tehsil: 'BHAWANA',
    schoolName: 'IQBAL MODEL SCHOOL',
    ownerName: 'ZAFAR ABBAS',
    ownerMobile: '3457964560',
    schoolAddress: 'MOHALLAH THATA MUSA BHOWANA',
    totalStudentsClass10: 106,
    primaryMale: 4,
    primaryFemale: 16,
    totalPrimaryTeachers: 20,
    grandTotal: 126,
    status: 'Recommended',
    cluster: 'Above 100'
  },
  {
    id: 'rs8',
    division: 'FAISALABAD',
    district: 'JHANG',
    tehsil: 'JHANG',
    schoolName: 'ABDALIAN SCIENCE SECONDARY SCHOOL BOYS',
    ownerName: 'RASHEED AHMAD',
    ownerMobile: '3346427595',
    schoolAddress: 'MANDI SHAH JEWANA',
    totalStudentsClass10: 147,
    primaryMale: 1,
    primaryFemale: 8,
    totalPrimaryTeachers: 9,
    grandTotal: 156,
    status: 'Recommended',
    cluster: 'Above 100'
  },
  {
    id: 'rs9',
    division: 'FAISALABAD',
    district: 'JHANG',
    tehsil: 'JHANG',
    schoolName: 'ABDALIAN SCIENCE SECONDARY SCHOOL GIRLS',
    ownerName: 'MUHAMMAD FAROOQ',
    ownerMobile: '3457585769',
    schoolAddress: 'MANDI SHAH JEWANA',
    totalStudentsClass10: 114,
    primaryMale: 0,
    primaryFemale: 26,
    totalPrimaryTeachers: 26,
    grandTotal: 140,
    status: 'Recommended',
    cluster: 'Above 100'
  },
  {
    id: 'rs10',
    division: 'FAISALABAD',
    district: 'JHANG',
    tehsil: 'JHANG',
    schoolName: 'HAQ BAHOO E/S KHANUANA',
    ownerName: 'Fozia Bibi',
    ownerMobile: '3424803913',
    schoolAddress: 'HAQ BAHOO SECONDARY SCHOOL KHANUANANA P/O G/H SCHOOL KHANUANA JHANG',
    totalStudentsClass10: 142,
    primaryMale: 4,
    primaryFemale: 15,
    totalPrimaryTeachers: 19,
    grandTotal: 161,
    status: 'Recommended',
    cluster: 'Above 100'
  },
  {
    id: 'rs11',
    division: 'FAISALABAD',
    district: 'JHANG',
    tehsil: 'JHANG',
    schoolName: 'MUSTAFAI MODEL SCHOOL CHHATTA',
    ownerName: 'Tasleem Akhtar',
    ownerMobile: '3447057576',
    schoolAddress: 'POST OFFICE CHHATTA',
    totalStudentsClass10: 123,
    primaryMale: 0,
    primaryFemale: 6,
    totalPrimaryTeachers: 6,
    grandTotal: 129,
    status: 'Recommended',
    cluster: 'Above 100'
  },
  {
    id: 'rs12',
    division: 'FAISALABAD',
    district: 'JHANG',
    tehsil: 'JHANG',
    schoolName: 'QUAID PUBLIC MODEL GIRLS ELEMENTARY SCHOOL',
    ownerName: 'AHMAD ALI',
    ownerMobile: '3013967664',
    schoolAddress: 'MANDI SHAH JEWANA',
    totalStudentsClass10: 141,
    primaryMale: 0,
    primaryFemale: 26,
    totalPrimaryTeachers: 26,
    grandTotal: 167,
    status: 'Recommended',
    cluster: 'Above 100'
  },
  {
    id: 'rs13',
    division: 'FAISALABAD',
    district: 'CHINIOT',
    tehsil: 'BHAWANA',
    schoolName: 'AL JAMIA ISLAMIA ELEMENTARY SCHOOL',
    ownerName: 'M Bashir Ahmad',
    ownerMobile: '3457986525',
    schoolAddress: 'JAMIABAD P.O MUHAMMADI SHARIF',
    totalStudentsClass10: 60,
    primaryMale: 5,
    primaryFemale: 11,
    totalPrimaryTeachers: 16,
    grandTotal: 76,
    status: 'Recommended',
    cluster: 'Above 50'
  },
  {
    id: 'rs14',
    division: 'FAISALABAD',
    district: 'CHINIOT',
    tehsil: 'BHAWANA',
    schoolName: 'FARAN PUBIC HIGH SCHOOL',
    ownerName: 'MUHAMMAD YOUNIS TAHIR',
    ownerMobile: '3457608455',
    schoolAddress: 'CHAK NO. 227/JB, PUL DILLOWALA',
    totalStudentsClass10: 185,
    primaryMale: 1,
    primaryFemale: 0,
    totalPrimaryTeachers: 1,
    grandTotal: 186,
    status: 'Recommended',
    cluster: 'Above 100'
  },
  {
    id: 'rs15',
    division: 'FAISALABAD',
    district: 'CHINIOT',
    tehsil: 'BHAWANA',
    schoolName: 'IQRA GRAMMAR MODEL SCHOOL',
    ownerName: 'Abaad Ali',
    ownerMobile: '3497939187',
    schoolAddress: 'PURANA LARY ADDA UBHAN ROAD BHOWANA',
    totalStudentsClass10: 65,
    primaryMale: 6,
    primaryFemale: 3,
    totalPrimaryTeachers: 9,
    grandTotal: 74,
    status: 'Recommended',
    cluster: 'Above 50'
  },
  {
    id: 'rs16',
    division: 'FAISALABAD',
    district: 'CHINIOT',
    tehsil: 'BHAWANA',
    schoolName: 'ISLAMIC IDEAL MODEL PUBLIC GIRLS E/S PATHANKOT',
    ownerName: 'SAID RASOOL',
    ownerMobile: '3457591040',
    schoolAddress: 'ADDA PATHANKOT P/O JAMIA MUHAMMADI SHARIF',
    totalStudentsClass10: 58,
    primaryMale: 3,
    primaryFemale: 14,
    totalPrimaryTeachers: 17,
    grandTotal: 75,
    status: 'Recommended',
    cluster: 'Above 50'
  },
  {
    id: 'rs17',
    division: 'FAISALABAD',
    district: 'CHINIOT',
    tehsil: 'BHAWANA',
    schoolName: 'MODERN ELEMENTRY SCHOOL SYSTEM',
    ownerName: 'Fizza Batool',
    ownerMobile: '3337704200',
    schoolAddress: 'JAMIABAD P/O MUHAMMADI SHARIF',
    totalStudentsClass10: 70,
    primaryMale: 1,
    primaryFemale: 14,
    totalPrimaryTeachers: 15,
    grandTotal: 85,
    status: 'Recommended',
    cluster: 'Above 50'
  },
  {
    id: 'rs18',
    division: 'FAISALABAD',
    district: 'CHINIOT',
    tehsil: 'BHOWANA',
    schoolName: 'ISLAMIC IDEAL SCIENCE HIGH SCHOOL',
    ownerName: 'AKHTAR RASUL',
    ownerMobile: '3467222507',
    schoolAddress: 'ADDA PATHAN KOT P/O JAMIA MUHAMMADI SHARIF',
    totalStudentsClass10: 58,
    primaryMale: 4,
    primaryFemale: 5,
    totalPrimaryTeachers: 9,
    grandTotal: 67,
    status: 'Recommended',
    cluster: 'Above 50'
  },
  {
    id: 'rs19',
    division: 'FAISALABAD',
    district: 'FAISALABAD',
    tehsil: 'FAISALABAD',
    schoolName: 'AL-QURAN PUBLIC HIGH SCHOOL (BOYS)',
    ownerName: 'MUHAMMAD PERVEZ',
    ownerMobile: '3227750016',
    schoolAddress: 'CHAK NO 121/JB GHOKHOWAL MILLAT ROAD FIASALABAD',
    totalStudentsClass10: 46,
    primaryMale: 0,
    primaryFemale: 35,
    totalPrimaryTeachers: 35,
    grandTotal: 81,
    status: 'Recommended',
    cluster: '>40 & <=50'
  },
  {
    id: 'rs20',
    division: 'FAISALABAD',
    district: 'FAISALABAD',
    tehsil: 'FAISALABAD',
    schoolName: 'Areez Public School',
    ownerName: 'Muhammad Mansoor Arif',
    ownerMobile: '3066026723',
    schoolAddress: 'CHAK NO 271 RB CHITTI KOTHI TEH SADAR DISTT FAISALABAD',
    totalStudentsClass10: 43,
    primaryMale: 0,
    primaryFemale: 10,
    totalPrimaryTeachers: 10,
    grandTotal: 53,
    status: 'Recommended',
    cluster: 'Exempted'
  }
];

// Extract unique divisions, districts, and tehsils for filters
export const uniqueDivisions = Array.from(new Set(realSchools.map(s => s.division))).sort();
export const uniqueDistricts = Array.from(new Set(realSchools.map(s => s.district))).sort();
export const uniqueTehsils = Array.from(new Set(realSchools.map(s => s.tehsil))).sort();

// Helper function to get districts by division
export const getDistrictsByDivision = (division: string) => {
  return Array.from(new Set(realSchools.filter(s => s.division === division).map(s => s.district))).sort();
};

// Helper function to get tehsils by district
export const getTehsilsByDistrict = (district: string) => {
  return Array.from(new Set(realSchools.filter(s => s.district === district).map(s => s.tehsil))).sort();
};
