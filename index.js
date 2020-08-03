const avalon = require("avalonbay-api");
const admin = require("firebase-admin");
const dotenv = require("dotenv");
dotenv.config();

const serviceAccount = {
  type: process.env.SERVICE_ACCOUNT_type,
  project_id: process.env.SERVICE_ACCOUNT_project_id,
  private_key_id: process.env.SERVICE_ACCOUNT_private_key_id,
  private_key: process.env.SERVICE_ACCOUNT_private_key,
  client_email: process.env.SERVICE_ACCOUNT_client_email,
  client_id: process.env.SERVICE_ACCOUNT_client_id,
  auth_uri: process.env.SERVICE_ACCOUNT_auth_uri,
  token_uri: process.env.SERVICE_ACCOUNT_token_uri,
  auth_provider_x509_cert_url:
    process.env.SERVICE_ACCOUNT_auth_provider_x509_cert_url,
  client_x509_cert_url: process.env.SERVICE_ACCOUNT_client_x509_cert_url,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseUrl: process.env.GOOGLE_DATABASE_URL
});

const adminDb = admin.firestore();


exports.updatePrices = async (req, res) => {
  const snapshot = await adminDb.collection("communities").get();
  const apartmentsRef = adminDb.collection("apartments");

  snapshot.forEach(async (community) => {
    const apartments = await avalon.searchCommunity(community.id);
    const apartmentsBatch = adminDb.batch();
    apartments.map((apartment) => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const updateItem = {
        prices: admin.firestore.FieldValue.arrayUnion({
          date: new Date(),
          price: apartment.price,
        }),
      };
      apartmentsBatch.update(apartmentsRef.doc(apartment.id), updateItem, {
        merge: true,
      });
    });
    console.log(community.id);
    apartmentsBatch.commit();
  });
  res.sendStatus(200);
};