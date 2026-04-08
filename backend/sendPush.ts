import * as admin from 'firebase-admin';
const serviceAccount = require('./serviceAccount.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as any),
});

async function sendPush() {
  const res = await admin.messaging().send({
    token: 'cLuYoTQIQ5Oia9gnn1mXC1:APA91bH0-aF14zPlFHPmgFicGq_hjog_4830Cw7FfQvUKE3_2j0cXjsZliaCmwqu1sxh3E4k8bQUQJzPJ-YsRCG6ivM3c1V7DhKeZEsBcx8lZbblCfg6NUQ',
    notification: {
      title: 'Test 🚀',
      body: 'Hello from VSCode!',
    },
  });

  console.log('SUCCESS:', res);
}

sendPush();