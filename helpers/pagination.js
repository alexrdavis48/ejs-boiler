
//Calculate skip value for records to skip in pagination events.
getSkip = (page, amount) => {
    if(page == 2)
            return amount;
    else if(page > 2)
        return (page - 1) * amount;
    else
        return 0;   
}

//Export a class object with constructor.
module.exports = class {

    //Constructor builds a pagination class instance to use with queries that want pagination.
    constructor(page, amount) {
        this.page = page;//Amount to run per page.
        this.amount = amount;
        this.skip = getSkip(page, amount);   
    }
}