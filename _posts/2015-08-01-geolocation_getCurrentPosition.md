---
layout: post
title:  "Geolocation getCurrentPosition()"
date:   2015-08-01 13:20:09
---

### Geolocation.getCurrentPosition()

O método `Geolocation.getCurrentPosition()` é usado para capturar a posição atual do dispositivo.

#### Sintaxe

{% highlight javascript %}
navigator.geolocation.getCurrentPosition(success, error, options)
{% endhighlight %}

##### Parâmetros

**_success_**  
    Uma função de retorno que captura um objeto [Position](https://developer.mozilla.org/en-US/docs/Web/API/Position) como seu parâmetro de entrada.

**_error_** _opcional_  
    Uma função de retorno opcional que captura um objeto [PositionError](https://developer.mozilla.org/en-US/docs/Web/API/PositionError) como parâmetro de entrada.

**_options_** _opcional_  
    Um objeto [PositionOptions](https://developer.mozilla.org/en-US/docs/Web/API/PositionOptions) opcional.

#### Exemplo
{% highlight javascript %}
var options = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0
};

function success(pos) {
  var crd = pos.coords;

  console.log('Sua posição atual é:');
  console.log('Latitude : ' + crd.latitude);
  console.log('Longitude: ' + crd.longitude);
  console.log('Mais ou menos ' + crd.accuracy + ' metros.');
};

function error(err) {
  console.warn('ERRO(' + err.code + '): ' + err.message);
};

navigator.geolocation.getCurrentPosition(success, error, options);
{% endhighlight %}

#### Especificações
| Especificações | Estado | Comentário |
|:---------------|:------:|:----------:|
| [Geolocation API](https://dev.w3.org/geo/api/spec-source.html) | Recomendação | Especificação inicial |

#### Navegadores compatíveis

##### **Desktop**
| Feature | Chrome | Firefox (Gecko) | Internet Explorer | Opera | Safari |
|:--------|:------:|:---------------:|:-----------------:|:-----:|:------:|
| Suporte básico | 5 | 3.5 (1.9.1) | 9 | 10.60 - Removido no 15.0 - Reintroduzido no 16.0 | 5 |

##### **Mobile**  
| Feature | Android | Chrome for Android | Firefox Mobile (Gecko) | IE Mobile | Opera Mobile | Safari Mobile |
|:--------|:-------:|:------------------:|:----------------------:|:---------:|:------------:|:-------------:|
| Suporte básico | ? | ? | 4.0 (4) | ? | 10.60 | ? | 

#### Veja também
* [Using geolocation](https://developer.mozilla.org/en-US/docs/WebAPI/Using_geolocation)
* [Navigator.geolocation](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/geolocation)
  
  
[Artigo no MDN](https://developer.mozilla.org/pt-BR/docs/Web/API/Geolocation/getCurrentPosition)
---
Rev 1.0: 2015-08-01
Rev 2.0: 2015-11-21