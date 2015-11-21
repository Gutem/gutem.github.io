---
layout: post
title:  "RandomSource.getRandomValues()"
date:   2015-11-21 15:41:00
---
### RandomSource.getRandomValues()

O método **RandomSource.getRandomValues()** permite que você obtenha valores criptográficos randômicos. O array passado como parâmetro é preenchido com números randômicos (randômicos no sentido criptogáfico).

Para garantir performance suficiente, as implementações não estão usando um gerador de número randômico de verdade, mas estão usando um gerador de número pseudo-randômico alimentado com um valor com entropia suficiente. Os PRNG (pseudo-random number generator - gerador de número pseudo-randômico) usados diferem de uma implementação para a outra, mas são adequadas para usos criptográficos. As implementações precisam ter um valor de alimentação com entropia suficiente, como uma fonte de entropia a nível de sistema.

Sintaxe

cryptoObj.getRandomValues(typedArray);

##### Parâmetros

**_typedArray_**  
É uma [TypedArray](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray) de números inteiros, que pode ser [Int8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Int8Array), [Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array), [Uint16Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint16Array), [Int32Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Int32Array), ou [Uint32Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint32Array). Todos os elementos no array serão sobrescristos com números randômicos.

##### Exceções
Um [QuotaExceededError](https://developer.mozilla.org/en-US/docs/Web/API/DOMException#exception-QuotaExceededError) [DOMException](https://developer.mozilla.org/en-US/docs/Web/API/DOMException) é enviado se o tamanho da requisição for maior que 65536 bytes.

#### Exemplo
{% highlight javascript %}
/* assumindo que window.crypto.getRandomValues está disponível */

var array = new Uint32Array(10);
window.crypto.getRandomValues(array);

console.log("Seus números da sorte são:");
for (var i = 0; i < array.length; i++) {
    console.log(array[i]);
}

{% endhighlight %}

#### Especificação
| Especificação | Estado | Comentário |
|:---------------|:------:|:-----------|
| [Web Cryptography API](https://dvcs.w3.org/hg/webcrypto-api/raw-file/tip/spec/Overview.html#RandomSource-method-getRandomValues) | Recomendação Candidato | Definição inicial |

#### Navegadores compatíveis

#### **Desktop**  
  
|Feature  | Chrome | Firefox (Gecko) | Internet Explorer | Opera | Safari |
|:--------|:------:|:---------------:|:-----------------:|:-----:|:------:|
| Suporte básico | 11.0 [WebKit bug 22049](https://bugs.webkit.org/show_bug.cgi?id=22049) | 21.0 | 11.0 | 15.0 | 3.1 |
  
#### **Mobile**  
  
| Feature | Android | Chrome for Android | Firefox Mobile (Gecko) | IE Mobile | Opera Mobile | Safari Mobile |
|:--------|:-------:|:------------------:|:----------------------:|:---------:|:------------:|:-------------:|
| Suporte básico | Não compatível | 23.0 | 21.0 | 11 | Não compatível | 6 |  


#### Veja também
* [Window.crypto](https://developer.mozilla.org/en-US/docs/Web/API/Window/crypto) to get a [Crypto](https://developer.mozilla.org/en-US/docs/Web/API/Crypto) object.
* [Math.random](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random), a non-cryptographic source of random numbers.
  
  
[Artigo no MDN](https://developer.mozilla.org/pt-BR/docs/Web/API/RandomSource/getRandomValues)
---
Rev 1.0: 2015-11-21