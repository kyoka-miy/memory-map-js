'use strict';

const form = document.querySelector('.form');
const containerMemories = document.querySelector('.memories');
const inputImage = document.querySelector('.form__input--image');
const inputDate = document.querySelector('.form__input--date');
const inputComment = document.querySelector('.form__input--comment');
const imgInput = document.querySelector('#img');

class Memory {
  id = (Date.now() + '').slice(-10);
  clicks = 0;

  constructor(coords, image, date, comment) {
    this.coords = coords;
    this.image = image;
    this.date = date;
    this.comment = comment;
  }
  click() {
    this.clicks++;
  }
}

class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #memories = [];
  #beingEdited = false;

  constructor() {
    this._getPosition();
    this._getLocalStorage();
    form.addEventListener('submit', this._newMemory.bind(this));
    containerMemories.addEventListener('click', this._moveToPopup.bind(this));
    containerMemories.addEventListener('click', this._deleteMemory.bind(this));
    containerMemories.addEventListener('click', this._editMemory.bind(this));
    imgInput.addEventListener('change', this._getImg.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
  }

  _loadMap(position) {
    //   console.log(position);
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    //   console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));

    this.#memories.forEach(memory => {
      this._renderMemoryMarker(memory);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
  }

  _hideForm() {
    inputImage.value = inputDate.value = inputComment.value = '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _newMemory(e) {
    if (this.#beingEdited) return;
    console.log('new submitted');
    e.preventDefault();

    // get the data from form
    const image = this.imgSrc;
    const date = inputDate.value;
    const comment = inputComment.value;
    const { lat, lng } = this.#mapEvent.latlng;

    // check if input is valid or required?
    let memory = new Memory([lat, lng], image, date, comment);
    console.log(memory);
    // console.log(memory);
    // Add new object to memory array
    this.#memories.push(memory);

    // // Render workout on map as marker
    this._renderMemoryMarker(memory);
    this._renderMemory(memory);

    // clear input fields
    this._hideForm();

    // set local storage
    this._setLocalStorage();

    console.log(this.#memories);
    // const deleteButton = document.querySelector('.memory-delete');
    // const editButton = document.querySelector('.memory-edit');
    // deleteButton.addEventListener('click', this._deleteMemory.bind(this));
  }

  _renderMemoryMarker(memory) {
    L.marker(memory.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxwidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `memory-popup`,
        })
      )
      .setPopupContent(`<img src="${memory.image}" alt="" />`)
      .openPopup();
  }

  _renderMemory(memory) {
    let html = `
      <li class="memory" data-id="${memory.id}">
        <div class="memory-left">
          <img src="${memory.image}" alt="" />
        </div>
        <div class="memory-right">
          <div class="memory-right-header">
            <div class="memory-date">${memory.date}</div>
            <div class="memory-icons">
              <a href="" class="memory-edit">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                  <!--! Font Awesome Pro 6.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. -->
                  <path
                    fill="#fff"
                    d="M362.7 19.3L314.3 67.7 444.3 197.7l48.4-48.4c25-25 25-65.5 0-90.5L453.3 19.3c-25-25-65.5-25-90.5 0zm-71 71L58.6 323.5c-10.4 10.4-18 23.3-22.2 37.4L1 481.2C-1.5 489.7 .8 498.8 7 505s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L421.7 220.3 291.7 90.3z"
                  />
                </svg>
              </a>
              <a href="" class="memory-delete">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                  <!--! Font Awesome Pro 6.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. -->
                  <path
                    fill="#fff"
                    d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"
                  />
                </svg>
              </a>
            </div>
          </div>
          <div class="memory-comment">${memory.comment}</div>
        </div>
      </li>
    `;

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    if (
      !e.target.closest('.memory-delete') &&
      !e.target.closest('.memory-edit')
    ) {
      const memoryEl = e.target.closest('.memory');
      if (!memoryEl) return;

      const memory = this.#memories.find(
        memory => memory.id === memoryEl.dataset.id
      );

      this.#map.setView(memory.coords, this.#mapZoomLevel, {
        animate: true,
        pan: {
          duration: 1,
        },
      });
    }

    // using the public interface
    // memory.click();
  }

  _setLocalStorage() {
    localStorage.setItem('memories', JSON.stringify(this.#memories));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('memories'));
    if (!data) return;
    this.#memories = data;
    this.#memories.forEach(memory => {
      this._renderMemory(memory);
    });
  }

  _deleteMemory(e) {
    if (e.target.closest('.memory-delete')) {
      console.log(this.#memories);
      e.preventDefault();

      // confirm ok > delete clicked memory from #memories
      if (confirm('Do you really want to delete this memory?')) {
        // get the data from form
        const deleteClickedMemory = e.target.closest('.memory');
        if (!deleteClickedMemory) return;

        const deleteMemory = this.#memories.find(
          memory => memory.id === deleteClickedMemory.dataset.id
        );

        // delete from array
        console.log(this.#memories.indexOf(deleteMemory));
        this.#memories.splice(this.#memories.indexOf(deleteMemory), 1);
        console.log(this.#memories);

        // reset sidebar
        const displayedMemories = document.querySelectorAll('.memory');
        displayedMemories.forEach(displayedMemory => {
          displayedMemory.remove();
        });

        // Render memory on map as marker
        this.#memories.forEach(memory => {
          this._renderMemory(memory);
          this._renderMemoryMarker(memory);
        });

        // clear input fields
        this._hideForm();

        // set local storage
        this._setLocalStorage();

        location.reload();
      }
    }
  }

  _editMemory(e) {
    if (e.target.closest('.memory-edit')) {
      this.#beingEdited = true;
      e.preventDefault();

      // get clicked memory
      const editClickedMemory = e.target.closest('.memory');
      if (!editClickedMemory) return;

      // select clicked memory from array
      const editMemory = this.#memories.find(
        memory => memory.id === editClickedMemory.dataset.id
      );

      // show form
      form.classList.remove('hidden');
      inputComment.value = editMemory.comment;
      inputDate.value = editMemory.date;
      // console.log(editMemory);
      // console.log(editMemory.file);
      // imgInput.files.push(editMemory.file);
      // console.log(imgInput.files[0]);
      // imgInput.files[0] = editMemory.file;

      // once submitted overwrite
      form.addEventListener('submit', e => {
        e.preventDefault();
        editMemory.date = inputDate.value;
        editMemory.comment = inputComment.value;
        editMemory.image = this.imgSrc;

        // reset sidebar
        const displayedMemories = document.querySelectorAll('.memory');
        displayedMemories.forEach(displayedMemory => {
          displayedMemory.remove();
        });
        // Render memory on map as marker
        this.#memories.forEach(memory => {
          this._renderMemory(memory);
          this._renderMemoryMarker(memory);
        });

        // clear input fields
        this._hideForm();

        // set local storage
        this._setLocalStorage();
      });
    }
  }

  _getImg(e) {
    // if(this.imgSrc) URL.revokeObjectURL(this.imgSrc);
    // this.imgSrc = URL.createObjectURL(e.target.files[0]);
    const reader = new FileReader();
    reader.onload = function (e) {
      this.imgSrc = e.target.result;
    }.bind(this);
    reader.readAsDataURL(e.target.files[0]);
  }

  reset() {
    localStorage.removeItem('memories');
    location.reload();
  }
}

const app = new App();
