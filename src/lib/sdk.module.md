# SDK Module Installation and Usage

## Installation

Open up a terminal to your application root and type `npm install @senzing/sdk-components-ng --save`.

## Add to app.module.ts

Now open up your applications main module file, in most cases this will be app.module.ts for projects generated by angular-cli.

```typescript
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { SenzingSdkModule } from '@senzing/sdk-components-ng';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    SenzingSdkModule.forRoot()
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

Now start up your application and start adding tags or referencing services. The simplest
 way to test that things are set up correctly is to add the static *sz-powered-by* tag
 to your applications html template.

```html
<sz-powered-by></sz-powered-by>
```