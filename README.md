# zetauth
>**Note** Use Node v16 and above

### New Boilerplate structure
###### Controllers
Controllers continue to be written in the controllers folder. But new controllers being written can make use of `DefaultController` or `AbstractBaseController` defined in zetapp package.


###### Services
New services go into the `services-v2` folder and can make use of `DefaultService` and `AbstractService` of zetapp

###### Routes
New routes go into the `routes/v2/` folder and can make use of `DefaultRoute` and `AbstractRoute` of zetapp package

###### Models
Models continue to remain in `model` folder, no changes as such


For more details on check [New Boilerplate](https://github.com/zetwerk/nodejs#readme) , [ZetApp Package](https://github.com/zetwerk/nodejs/pkgs/npm/zetapp) and [Code Guidelines](https://docs.zetwerk.com/docs/code-guidelines)