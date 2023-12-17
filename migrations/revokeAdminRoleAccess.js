const db = require('../lib/utils/db');
const confluentKafka = require('../lib/utils/confluent-kafka');
const Role = require('../models/role');
const User = require('../models/user');
const UserService = require('../services/user');
const usersEmail = [
    'aakanksha.raj@zetwerk.com',
    'aayush.m@zetwerk.com',
    'abirami.s@zetwerk.com',
    'adithya.k@zetwerk.com',
    'aditya.p@zetwerk.com',
    'admin@zetwerk.com',
    'akash.h@zetwerk.com',
    'akshay.j@zetwerk.com',
    'amber.khanna@zetwerk.com',
    'amritacharya@zetwerk.com',
    'amrit@zetwerk.com',
    'anshu.k@zetwerk.com',
    'anukriti.s@zetwerk.com',
    'anurag.misra@zetwerk.com',
    'anwesha.k@zetwerk.com',
    'apurva.agarwal@zetwerk.com',
    'arfath.r@zetwerk.com',
    'akshay.j+arnold.n@zetwerk.com',
    'arun.k@zetwerk.in',
    'arun.m@zetwerk.com',
    'automation.script@zetwerk.com',
    'balaji.d@zetwerk.com',
    'bhaskar.ba@zetwerk.in',
    'chetan.j@zetwerk.com',
    'cso.approval@zetwerk.com',
    'datta.n@zetwerk.com',
    'dhiraj.p@zetwerk.com',
    'eby.a@zetwerk.com',
    'divya.m@zetwerk.com',
    'gokul.s@zetwerk.com',
    'gourab.s@zetwerk.com',
    'gursimarsingh.c@zetwerk.com',
    'automationhubspot@zetwerk.com',
    'ishan.s@zetwerk.com',
    'jatin.o@zetwerk.com',
    'jeevan.m@zetwerk.com',
    'kabita.agarwal@zetwerk.com',
    'karthik.k@zetwerk.com',
    'kirti.singh@zetwerk.com',
    'krishnan.s@zetwerk.com',
    'kshitij.j@zetwerk.com',
    'kuldeep.g@zetwerk.com',
    'lekshmi.n@zetwerk.com',
    'manisha.s@zetwerk.com',
    'rajat.v@zetwerk.com',
    'nabeel.s@zetwerk.com',
    'nagesh.n@zetwerk.com',
    'nehal.a@zetwerk.com',
    'neveen.r@zetwerk.com',
    'nikhil.b@zetwerk.com',
    'omkar@zetwerk.com',
    'osama.e@zetwerk.com',
    'pinaka_oms.sys@zetwerk.com',
    'pooja.v@zetwerk.com',
    'pramith.k@zetwerk.com',
    'prem.kumar@zetwerk.com',
    'priyam.agarwal@zetwerk.com',
    'rahul.juneja@zetwerk.com',
    'rahul@zetwerk.com',
    'rajendra.p@zetwerk.com',
    'rajiv.jha@zetwerk.com',
    'ravi.j@zetwerk.com',
    'reeya.p@zetwerk.com',
    'rituparna.b@zetwerk.com',
    'rohit.chavan@zetwerk.com',
    'ronit.kumar@zetwerk.com',
    'sachin.r@zetwerk.com',
    'sadashivanand.sm@zetwerk.com',
    'siddardha.s@zetwerk.com',
    'sandeep.m@zetwerk.com',
    'sangram.d@zetwerk.com',
    'sankar.narayanan@zetwerk.com',
    'santhosh.r1@zetwerk.com',
    'lakshmi.k@zetwerk.com',
    'sathish.aravind@zetwerk.com',
    'saurabh.t@zetwerk.com',
    'sharptanks_oms.sys@zetwerk.com',
    'shivam.a@zetwerk.com',
    'shubham.s@zetwerk.com',
    'smruti.p@zetwerk.com',
    'snehashish.p@zetwerk.com',
    'rsrinath@zetwerk.com',
    'suman.s@zetwerk.com',
    'swetank.b@zetwerk.com',
    'talat.naaz@zetwerk.in',
    'tarun.a@zetwerk.com',
    'tarun.k@zetwerk.com',
    'ullas.k@zetwerk.com',
    'vaishnavi.j@zetwerk.com',
    'varchas.b@zetwerk.com',
    'vetrivel.a@zetwerk.com',
    'vishal.k@zetwerk.com',
    'vrishabendra.j@zetwerk.com',
    'yash.s@zetwerk.com',
    'zetwerk-aerosystems_oms.sys@zetwerk.com',
    'zetwerk-kinetix_oms.sys@zetwerk.com',
    'zetwerk-usa_oms.sys@zetwerk.com',
    'sankar.narayanan+bhuvaneswaran@zetwerk.com',
    'sankar.narayanan+bhuvaneswaran+012@zetwerk.com',
    'akshay.j+nikhil.s@zetwerk.com',
    'arpit.s+testdup2@zetwerk.com',
    'arpit.s+testdup@zetwerk.com'
];

async function run() {
    try {
        await db.connect(async () => {});
        await confluentKafka.initializeConfluentKafka();
        await confluentKafka.initializeProducer();
        await db.setupHelpers();
        await updateUsersRole();
        console.log('%c All users has been updated', 'background: #222; color: #bada55');
        return;
    } catch (e) {
        console.log('Error in run Block', e);
        throw e;
    }
}

async function updateUsersRole() {
    const roleToRemove = await Role.findOne({ name: 'ADMIN' }).lean();
    usersEmail?.forEach(async userEmail => {
        const user = await User.findOne({ email: userEmail }).lean();
        user.roleId = user?.roleId?.filter(roleId => roleId.toString() !== roleToRemove?._id.toString());
        await UserService.updateUserById(user?._id, user);
    });
    return;
}

run();
