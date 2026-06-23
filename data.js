/* PLACEHOLDER backbone — will be replaced by the full synthesized tree. */
window.FAMILY_DATA = {
  meta: {
    whatsapp: "+919290169960",
    mosqueMapUrl: "https://maps.app.goo.gl/qhEz8VM44VQ7t6y17",
    composer: "Sufi S.M. Mujeeb",
    reconstructedBy: "Mohammed Danish",
    place: "Krovvidi, Andhra Pradesh, India"
  },
  nodes: [
    { id: "root", name: "Shaik Ismail Shah Qadri", parent: null, note: "Came from Baghdad; settled in Krovvidi. d. 1592 A.D." },
    { id: "c-noor", name: "Shaik Mohd Noor Saheb", parent: "root", note: "His son's call as Pathapur Pather ki Masjid" },
    { id: "c-qasim", name: "Shaik Mohd Qasim Saheb", parent: "root" },
    { id: "c-aqadir", name: "Shaik Abdul Qadir Saheb", parent: "root" },
    { id: "c-abdulla", name: "Shaik Abdulla Saheb", parent: "root" },
    { id: "c-jalal", name: "Shaik Mohd Jalal Saheb", parent: "root" },
    { id: "c-ismail", name: "Shaik Ismail Saheb", parent: "root" },
    { id: "c-hafiz", name: "Hafiz Shaik Mohd Jalal Saheb", parent: "root" },
    { id: "c-jee", name: "Shaik Jee Saheb", parent: "root" },
    { id: "c-bangaru", name: "Bangaru Pir Abdullah Saheb", parent: "root", uncertain: true },
    { id: "c-salam", name: "Shaik Salam Saheb", parent: "root", uncertain: true },
    { id: "c-raheem", name: "Shaik Raheem Saheb", parent: "root" },
    { id: "jee-bawa", name: "Bawa Ji Saheb", parent: "c-jee" },
    { id: "jee-hyder", name: "Shaik Hyder Saheb", parent: "jee-bawa" },
    { id: "jee-sarver", name: "Shaik Sarver Saheb", parent: "jee-hyder" },
    { id: "fareed", name: "Fareeduddin Saheb", parent: "c-qasim", note: "Owner's grandfather (printed on chart)" },
    { id: "ansar", name: "Mohd Ansar Pasha", parent: "fareed", note: "Owner's father" },
    { id: "danish", name: "Mohammed Danish", parent: "ansar", style: "handwritten", owner: true, note: "Added by hand on the original chart" },
    { id: "hussain", name: "Mohammed Hussain Ali", parent: "danish" }
  ]
};
