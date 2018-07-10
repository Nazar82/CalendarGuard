const ldap = require('ldapjs');
const ldapUrl = {
    url: 'ldap://172.24.94.13'
};

class LdapLogging {

    constructor(ldapUrl) {
        this.ldapUrl = ldapUrl;
    }

    authenticateUser(name, password) {
        return new Promise((resolve, reject) => {

            let client = ldap.createClient(this.ldapUrl);

            client.bind('SYNAPSE\\' + name, password, (err) => {

                if (err) {
                    client.unbind();
                    reject(err);
                }

                client.unbind();
                 resolve();

            });
        });
    }
}

module.exports = new LdapLogging(ldapUrl);


