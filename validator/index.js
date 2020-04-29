exports.createPostValidator = (req, res, next) => {
    
    req.check('title', 'Please enter a title').notEmpty();
    req.check('title', 'Title must be minimum 4 characters').isLength({
        min: 4,
        max: 255
    });

    req.check('body', 'Please enter a body text').notEmpty();
    req.check('body', 'Body must be minimum 10 characters').isLength({
        min: 10,
        max: 255
    });

    //Check Errors
    const errors = req.validationErrors();
    //if ERROR -> display the first one 
    if (errors) {
        const firstError = errors.map( error => error.msg)[0]
        return res.status(400).json({ error: firstError })        
    }
    //procceed to next mmiddleware
    next();
};

exports.createUserValidator = (req, res, next) => {
    
    req.check('name', 'Name is required').notEmpty();
    
    req.check('email', 'Email must have a minimum of 4 characters')
        .matches(/.+\@.+\..+/)
        .withMessage("Email must contain @")
        .isLength({ min: 4, max: 255 });

    req.check('password', 'Password is required').notEmpty();
    req.check('password')
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters")
        .matches(/\d/)
        .withMessage('Password must contain a number');

    const errors = req.validationErrors();
    if (errors) {
        const firstError = errors.map( error => error.msg)[0]
            return res.status(400).json({ error: firstError })        
    }
    next();
};

exports.passwordResetValidator =  (req, res, next) => {
    // check for password
    req.check("newPassword", "Password is required").notEmpty();
    req.check("newPassword")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 chars long")
        .matches(/\d/)
        .withMessage("must contain a number")
        .withMessage("Password must contain a number");
 
    // check for errors
    const errors = req.validationErrors();
    // if error show the first one as they happen
    if (errors) {
        const firstError = errors.map(error => error.msg)[0];
        return res.status(400).json({ error: firstError });
    }
    // proceed to next middleware or ...
    next();
}